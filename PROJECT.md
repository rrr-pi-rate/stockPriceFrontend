# StockPriceFrontend — projektstatus

> Denne fil er den løbende kilde til sandhed for projektet. Opdateres efter hver væsentlig beslutning/ændring.

## Formål

Flytte dashboard-frontenden ud af `StockPriceSheetPrintService` (som i dag serverer statisk HTML fra `wwwroot/`) og over i sit eget Angular-projekt. Det skal **ikke** være en 1:1 oversættelse af HTML/JS til Angular — det skal skrives om til et ordentligt struktureret frontend-projekt med onion/hexagonal-inspireret lagdeling, testbarhed og klar afhængighedsretning.

Backend (`StockPriceSheetPrintService`) forbliver uændret og eksponerer kun API'et. Al præsentationslogik, som i dag ligger i `<script>`-tags, skal flyttes til frontend-domænet.

## Kilder (legacy)

Ligger i `../StockPriceSheetPrintService/StockPriceSheetPrintService/wwwroot/`:

- **`kirby-landing.html`** — splash-side med "slide to unlock"-interaktion, linker videre til `kirby.html`. Ren UI, ingen datalogik.
- **`kirby.html`** — selve dashboardet. Indeholder:
  - 8 stat-cards (latest total, 1-dags ændring, YTD, total datapunkter, periode-ændring, periode-datapunkter, bedste dag, volatilitet)
  - Chart.js-linjegraf med periode-filter (1W/1M/3M/6M/1Y/YTD/All), benchmark-overlay (MSCI/S&P500/OMXC25/inflation/obligationer — hardcodede årlige renter, ekstrapoleret fra første datapunkt), og lineær trendlinje (least-squares regression)
  - Custom dropdown-komponent (Kirby-design-inspireret) og toggle-knapper
  - Al beregning (statistik, benchmark-generering, trend-regression, periodefiltrering) sker client-side i vanilla JS på baggrund af ét API-kald

Bemærk: `KirbyVisitTrackingMiddleware` i backend tæller besøg på disse to sider (Prometheus-metric). Opdatering: tracking er genindført — frontend POST'er til `/track/landing|dashboard` ved route-navigation (`VisitTrackerPort` → `HttpVisitTrackerAdapter`), nginx proxyer til backend, som bruger samme middleware/metric. Oprindelig note: men hvis siderne får nye URL'er/navne, skal vi huske at denne middleware bliver irrelevant/skal fjernes på et senere tidspunkt (ikke en del af dette projekt, bare en note).

## Backend-kontrakt (API)

Endpoints (se spec for alle):

```
GET /dashboard/data → DashboardDataPointDto[] { date: string (yyyy-MM-dd), value: number }
GET /dashboard/transactions → DashboardTransactionDto[] { bookingId: string, amount: number, date: string (yyyy-MM-dd) }
```

Spec ligger i `openapi/openapi.dashboard.yaml` (OpenAPI 3.1.1). `DashboardController.cs` og `IDashboardService` (backend) er source of truth for kontrakten — spec'en skal genereres/holdes i sync derfra, ikke omvendt.

Client/DTO-generering er allerede sat op:
- `openapitools.json` + `npm run openapi` → kører `openapi-generator-cli generate -g typescript-angular -o ./generated/api`
- Genereret kode ligger i `./generated/api` (gitignored — genereres i CI/Docker-build, se `Dockerfile`)

## Målarkitektur: Onion i en Angular-kontekst

Afhængighedsregel: **ydre lag kender til indre lag — aldrig omvendt.** Domain kender intet til Angular, HTTP eller det genererede API-klientbibliotek.

```
src/app/
  domain/            ← Lag 1 (inderst). Rene TS-typer + rene funktioner. Ingen Angular-imports.
    models/          Portfolio data point, Period, BenchmarkKind, ...
    calculations/    stats.ts, trend.ts, benchmark.ts (ren logik, 1:1 unit-testbar)

  application/        ← Lag 2. Use-cases + outbound ports (interfaces) som application definerer,
    ports/outbound/    og som infrastructure skal implementere. Orkestrerer domain-logik.
    use-cases/         fx GetDashboardOverview

  infrastructure/     ← Lag 3. Konkrete adaptere. Her lander det genererede OpenAPI-klientkode.
    outbound/
      dashboard/       Implementerer application/ports/outbound/*.ts vha. generated/api

  presentation/        ← Lag 4 (yderst). Angular-specifikt: components, pages, signals, routing.
    dashboard-page/
    components/        stat-card, period-selector, benchmark-dropdown, trend-toggle, portfolio-chart
    landing-page/

generated/api/         ← Genereret af openapi-generator, aldrig redigeret manuelt, git-ignoreret
```

Hvorfor det giver mening her: al den "farlige" logik i `kirby.html` (statistik, trend-regression, benchmark-ekstrapolering, periodefiltrering) er ren funktion af data — intet DOM, intet HTTP. Den hører til i `domain/`, kan unit-testes uden Angular TestBed, og overlever uændret selvom vi skifter chart-bibliotek eller HTTP-klient.

**Ingen `inbound` i `infrastructure` (endnu):** i backend'en er inbound HTTP-controllers der bliver kaldt udefra. I denne app er der lige nu ingen ikke-UI-drevne triggere (deep links, websockets, polling) — kun knapklik der går gennem `presentation` direkte til `application`. At lave en tom `inbound`-mappe nu ville være spekulativ struktur uden indhold, så den er droppet. Tilføjes den dag der faktisk er et konkret behov (se beslutningslog).

## Roadmap

- [x] **Trin 1 — generér OpenAPI-klienten** og se det faktiske output (typer/services), så `infrastructure`-laget designes efter virkeligheden og ikke gætværk.
  - Java (JRE 17) installeret lokalt, `npm install` og `npm run openapi` kørt.
  - **Fundet og rettet fejl i spec'en:** backend-DTO'en er `record DashboardDataPointDto(string Date, decimal Value)`. Swashbuckle eksporterede `value` som `type: [number, string]` + regex-pattern (typisk artefakt for `decimal` i OpenAPI 3.1), hvilket gjorde at openapi-generator producerede en **tom, ubrugelig** `DashboardDataPointDtoValue`-interface i stedet for `number`.
  - Rettet i `openapi/openapi.dashboard.yaml`: `value` er nu simpelt `type: number, format: double`. Efter regenerering giver klienten korrekt `DashboardDataPointDto { date: string; value: number }`.
  - **Opfølgning (ikke gjort endnu):** hvis spec'en på sigt skal auto-genereres fra backend (jf. "backend er source of truth" nedenfor), skal Swashbuckle-konfigurationen i `StockPriceSheetPrintService` justeres til at eksportere `decimal` som almindeligt `number`, så denne manuelle rettelse ikke bliver overskrevet/skal gentages.
  - Genereret klient ligger i `generated/api/` (gitignored): `DashboardService.dashboardDataGet()` returnerer `Observable<DashboardDataPointDto[]>`, og `provideApi(...)` fra `generated/api/provide-api.ts` bruges til at wire `BASE_PATH`/`Configuration` op i `app.config.ts`.
- [x] **Trin 2 — lav mappeskelettet** (`domain/`, `application/`, `infrastructure/`, `presentation/`) og aftal navngivningskonventioner.
  - Mapper oprettet uden indhold (ingen README-stubs — bruges ikke i dette projekt). `infrastructure/inbound` droppet, se beslutningslog.
  - Navngivning: kebab-case filer med rolle-suffix (`.model.ts`, `.port.ts`, `.use-case.ts`, `.adapter.ts`, `.mapper.ts`, `.calculator.ts`); PascalCase klasser/interfaces der matcher filnavnet. Afhængighedsretning: `presentation → application → domain`, `infrastructure → application → domain`. Kobling mellem port og adapter sker via Angular DI i `app.config.ts` (composition root).
- [x] **Trin 3 — domain-laget**: portér stats/trend/benchmark-beregninger fra `kirby.html` til rene, unit-testede TS-funktioner.
  - [x] `domain/models/portfolio-data-point.model.ts`, `domain/models/period.model.ts` (discriminated union: `all` | `ytd` | `trailing-days`)
  - [x] `domain/calculations/period-filter.ts` — svarer til filtreringsdelen af `filterAndRender()` i `kirby.html`. Tager en `referenceDate`-parameter (default `new Date()`) i stedet for at kalde `new Date()` internt, så den er deterministisk testbar. 4 tests, alle grønne.
  - [x] `portfolio-stats.calculator.ts` — svarer til `populateStats()`/`populatePeriodStats()` i `kirby.html`: `latestDataPoint`, `dayOverDayChange`, `yearToDateChange` (tager også `referenceDate`), `dateRange`, `periodChange`, `bestDay`, `volatility` (population std. dev., kræver ≥3 punkter ligesom originalen). 12 tests, alle grønne.
  - [x] `trend.calculator.ts` — svarer til `generateTrend()` i `kirby.html`: least-squares lineær regression over indeks, rundet til hele tal. `computeTrendLine(entries): number[]`, samme længde/orden som input. 3 tests, alle grønne.
  - [x] `benchmark.calculator.ts` — svarer til `generateBenchmark()` i `kirby.html`. `computeBenchmarkLine(entries, annualRate): number[]` tager renten som et almindeligt tal og ved intet om hvor den kommer fra — se decoupling-punktet nedenfor. 3 tests, alle grønne.

**Bevidst decoupling af benchmark-renter (efter ønske):** `computeBenchmarkLine` kender kun til et rente-tal, ikke til hvor det stammer fra. Selve rentetabellen (MSCI/S&P500/OMXC25/inflation/obligationer) er flyttet bag en outbound port, et lag tidligere end resten af trin 4/5, fordi det var en udtrykkelig kravsætning:
- `application/ports/outbound/benchmark-rate-provider.port.ts` — `BenchmarkRateProviderPort.getAnnualRates(): Observable<BenchmarkRates>`. Returnerer en `Observable` fra starten, så et fremtidigt HTTP-kald ikke kræver en signaturændring.
- `infrastructure/outbound/benchmark/static-benchmark-rate.adapter.ts` — nuværende implementering: samme hardcodede tabel som i `kirby.html`, pakket i `of(...)`. Skal vi senere hente satserne udefra, tilføjes bare en ny adapter (fx `HttpBenchmarkRateAdapter`) og der ændres én linje DI-wiring i `app.config.ts` — domain, resten af application og presentation rører vi ikke.
- Endnu ikke koblet til DI i `app.config.ts` — det sker når presentation-laget rent faktisk skal bruge den (trin 5/6).
- [x] **Trin 4 — application-laget**: definér ports (fx `DashboardRepository`) og use-cases der bruger domain-funktionerne.
  - `application/ports/outbound/dashboard-repository.port.ts` — `DashboardRepositoryPort.getHistoricalData(): Observable<PortfolioDataPoint[]>`. Endnu ikke koblet til DI (kommer i trin 5, når den rigtige adapter findes).
  - `application/models/dashboard-overview.model.ts` — samlet view-model for use-casens resultat: `DashboardSummary` (fuld historik, som `populateStats()`) + `DashboardPeriodView` (periode-filtreret, som `populatePeriodStats()`, inkl. valgfri `trendLine`/`benchmarkLine`).
  - `application/use-cases/get-dashboard-overview.use-case.ts`:
    - `buildOverview(...)` er en **ren funktion** (entries, period, options, rates, referenceDate) → `DashboardOverview`, der kalder de fire domain-beregninger. Al orkestreringslogik er samlet her og fuldt unit-testbar uden Observables/DI.
    - `GetDashboardOverviewUseCase` er en tynd Angular-klasse (constructor-DI, ikke `inject()`, så den kan instantieres direkte med test-doubles uden TestBed) der henter data fra `DashboardRepositoryPort`, og henter kun benchmark-renter fra `BenchmarkRateProviderPort` når et benchmark faktisk er efterspurgt.
  - 9 nye tests (5 på `buildOverview`, 2 på use-case-klassens wiring inkl. at rate-provideren *ikke* kaldes uden benchmark, 2 eksisterende justeret) — 36/36 grønne i alt.
- [x] **Trin 5 — infrastructure-laget**: adapter der implementerer porten vha. den genererede klient.
  - `infrastructure/outbound/dashboard/dashboard.mapper.ts` — `toPortfolioDataPoints(dtos: DashboardDataPointDto[])`. Selvom `DashboardDataPointDto` og `PortfolioDataPoint` har samme form lige nu, holder vi mapningen explicit, så et fremtidigt skred i backend-DTO'en ikke automatisk lækker ind i domain-modellen.
  - `infrastructure/outbound/dashboard/dashboard-api.adapter.ts` — `DashboardApiAdapter extends DashboardRepositoryPort`, kalder `DashboardService.dashboardDataGet()` fra `generated/api` og mapper resultatet.
  - Tilføjet TS path-alias `@generated/*` → `./generated/*` i `tsconfig.json`, så infrastructure-koden ikke skal bruge dybe relative imports (`../../../../generated/api`) ind i den genererede klient.
  - 3 nye tests (mapper + adapter), 39/39 grønne i alt.
- [x] **Backend-URL-beslutning: nginx reverse-proxy** (i stedet for build-time environment-filer eller en runtime `config.json`).
  - **Hvorfor:** backend har ingen CORS opsat. Med en reverse-proxy kalder Angular-appen en relativ sti (`/dashboard/data`), og nginx/proxyen videresender den — helt uden CORS, uden at backend skal ændres, og matcher hvordan `kirby.html` fungerede (samme origin). Backend-adressen bor ét sted (infra-config), ikke i JS-bundlen.
  - `nginx.conf` er erstattet af `nginx.conf.template` (nginx's officielle `envsubst`-templating: filer i `/etc/nginx/templates/*.template` renderes til `/etc/nginx/conf.d/` ved container-start). `location /dashboard/ { proxy_pass ${BACKEND_BASE_URL}/dashboard/; }`.
  - `Dockerfile`: `ENV BACKEND_BASE_URL=http://192.168.1.239:5151` (default), kopierer nu `nginx.conf.template` i stedet for `nginx.conf`.
  - `docker-compose.yml`: samme variabel under `environment:`, så adressen kan overstyres uden at bygge et nyt image.
  - `proxy.conf.json` (ny) + `angular.json`'s `serve.options.proxyConfig` — så `ng serve` proxier `/dashboard` til samme backend-adresse, og lokal udvikling matcher produktion.
  - `app.config.ts`: `provideHttpClient()`, `provideApi('')` (tom/relativ base path), og DI-binding af begge outbound-porte: `{ provide: DashboardRepositoryPort, useClass: DashboardApiAdapter }`, `{ provide: BenchmarkRateProviderPort, useClass: StaticBenchmarkRateAdapter }`.
  - Verificeret: `npm run build` bygger stadig rent, `npm test` og `npm run lint` er begge grønne.
- [x] **ESLint tilføjet** — projekt og CI.
  - Sat op via `ng add @angular-eslint/schematics` (den officielle Angular 22-vej): `eslint.config.js`, `npm run lint` (`ng lint`), lint-target i `angular.json`.
  - **Én bevidst regel-override:** `@angular-eslint/prefer-inject` (som er del af det anbefalede regelsæt) er slået fra for `application/**` og `infrastructure/**`, fordi disse lag med vilje bruger constructor-injection i stedet for `inject()` — det er hvad der gør use-cases/adaptere testbare med almindelige test-doubles uden `TestBed` (`inject()` kræver en aktiv Angular injection-context). Reglen gælder stadig fuldt ud for `presentation/`.
  - CI (`.github/workflows/main.yml`): nyt `Lint`-step (`npm run lint`) tilføjet mellem "Generate OpenAPI client" og "Test" — placeret efter klient-generering, fordi ESLint's type-checking ellers ikke kan resolve typer fra `generated/api`.
- [x] **Angular 22 → 21-nedgradering + rigtige Kirby-komponenter** (i stedet for hånd-bygget Kirby-inspireret CSS).
  - **Baggrund:** brugeren ønskede de *rigtige* Kirby-komponenter (cookbook.kirby.design / github.com/kirbydesign/designsystem) i stedet for hånd-lavet CSS der bare ligner Kirby, som `kirby.html` gjorde.
  - **Undersøgt (via GitHub-repo + npm registry, ikke gættet):** der findes to udgaver.
    1. `@kirbydesign/designsystem` v11.11.2 — den modne, komplette pakke (card, dropdown, button, badge, spinner, chart, m.fl.), bygget **på Ionic** (`@ionic/angular` 8.6.3). Peer-range: kun Angular 18–21, ikke 22.
    2. `@kirbydesign/core` v0.0.94 — nyt Lit-baseret, Angular-uafhængigt bibliotek, Angular 22-kompatibelt, men indeholder i dag **kun badge/spinner/divider** (intet card/dropdown/button endnu), og dets Angular-wrapper (`@kirbydesign/angular`) er slet ikke udgivet på npm.
  - **Valgt (brugerens beslutning):** nedgradér til Angular 21 og brug den fulde, rigtige `@kirbydesign/designsystem` v11 + Ionic, for at få alle de rigtige komponenter.
  - **Udført:**
    - `package.json`: `@angular/*` → `^21.2.24`, `typescript` → `~5.9.3` (Angular 21's build-peer kræver `<6.0`), `vitest` → `^4.1.11` (Angular 21's build-peer kræver `^4.0.8`), `angular-eslint` → `^21.4.0`. Tilføjet `@ionic/angular@8.6.3`, `@kirbydesign/designsystem@^11.11.2`, `@kirbydesign/core@^0.0.94`, `zone.js@~0.16.0`, og Kirbys øvrige peer-dependencies (`swiper`, `chart.js@^3.9.1`, `date-fns`, `date-fns-tz`, `inputmask`, `@floating-ui/dom`, `@fontsource/roboto`, `chartjs-adapter-date-fns`, `chartjs-plugin-annotation`, `chartjs-plugin-datalabels`, `@angular/cdk`, `@angular/animations`).
    - Global npm opgraderet til `11.19.0` (matcher `packageManager`-feltet) — den ældre 10.9.8 crashede (`Cannot read properties of null (reading 'edgesOut')`, en kendt npm-arborist-bug) på det komplekse peer-graf.
    - **Zoneless bekræftet virker med Kirby/Ionic:** Kirbys egen officielle demo-app (cookbook) bruger `provideZonelessChangeDetection()` — modsat hvad jeg først forventede, kræver den nyeste Ionic/Kirby-kombination *ikke* zone.js-patching, selvom `@ionic/angular`s peerDependencies stadig formelt lister `zone.js`. `zone.js` er installeret (for at tilfredsstille peer-resolution) men ikke importeret/aktiveret.
    - `app.config.ts`: `provideZonelessChangeDetection()`, `provideKirby(withGlobalSetup())` (sætter Ionic op internt), `provideAnimations()`, `importProvidersFrom(BrowserModule, FormsModule)` — mønster kopieret 1:1 fra Kirbys egen `apps/cookbook/src/main.ts`.
    - `src/styles.css` → `src/styles.scss` med `@use '@kirbydesign/core/scss/global-styles';` (bemærk: **ikke** `src/scss/...`-stien fra Kirbys monorepo-kildekode — den findes ikke i den udgivne npm-pakke, kun i deres eget workspace).
    - `angular.json`: styles peger på `.scss`, bundle-budgets hævet (500kB/1MB → 2MB/3MB, Ionic+Kirby+Chart.js er markant større).
    - Ryddet default Angular CLI-scaffolden væk: `app.html` er nu bare `<router-outlet />`, `app.ts` uden det ubrugte `title`-signal, `index.html` sat til `lang="da"` og titel "Portefølje Dashboard".
    - `openapitools.json`/`npm run openapi`-scriptets `ngVersion` opdateret til `21.2.24`.
  - **Kendt, accepteret risiko:** `npm audit` flager en kritisk sårbarhed i `swiper` (prototype pollution, GHSA-hmx5-qpq5-p643) — det er en transitiv peer-dependency af `@kirbydesign/designsystem` (bruges til deres carousel/slider-komponent), som vi ikke selv bruger i dette dashboard. En fix kræver swiper v14, som er uden for Kirbys egen understøttede peer-range (`^9.2.0`), så vi kan ikke rette det uden at bryde Kirbys egen kontrakt. Accepteret som upstream-risiko, fordi vi ikke bruger swiper-funktionalitet direkte — genbesøg hvis vi nogensinde bruger et Kirby-carousel/slider-komponent.
  - **Verificeret:** `npm run build` (✓, initial bundle ~849kB raw / 209kB transfer, inden for nye budgets), `npm test` (38/38 grønne), `npm run lint` (grøn), `ng serve` starter og serverer HTML korrekt. **Ikke verificeret:** faktisk runtime-adfærd i en rigtig browser (Ionic/Kirby-providers der initialiserer uden fejl) — der er ingen browser/Playwright tilgængelig i dette miljø til at teste det. Bør tjekkes manuelt i en browser, særligt fordi zoneless+Ionic-kombinationen er relativt ny.
- [x] **Rettet en pakke-bug i `@kirbydesign/core@0.0.94`** der blokerede alle unit-tests af komponenter der (transitivt) rører Kirby/Ionic.
  - **Fund:** `@kirbydesign/core`s kompilerede ESM-output (`dist/**/*.js`) har gennemgående relative imports uden filendelse (fx `from './color-helper'`) og et enkelt directory-import (`export * from './helpers'` i `dist/index.js`). Det virker fint i browseren (esbuild/Vite er lempelige og gætter `.js`/`index.js`), men Node's egen strikse ESM-resolver (som Vitest bruger til at køre unit-tests) afviser begge mønstre og kaster `ERR_UNSUPPORTED_DIR_IMPORT`/`Cannot find module`.
  - Prøvede først en `vitest.config.ts` med `resolve.alias` + `server.deps.inline` for at omgå det — virkede ikke (Angular's `@angular/build:unit-test`-builder eksternaliserer tilsyneladende node_modules på en måde der ikke respekterer det). Fjernet igen.
  - **Løsning:** rettet alle 9 berørte filer i `node_modules/@kirbydesign/core/dist/{badge,divider,spinner,helpers}` til at have korrekte `.js`-endelser/`index.js`-stier, og fanget det som én samlet patch med [patch-package](https://www.npmjs.com/package/patch-package): `patches/@kirbydesign+core+0.0.94.patch`. Ny devDependency `patch-package`, nyt script `"postinstall": "patch-package"` i `package.json` — patchen genanvendes automatisk efter hver `npm install`.
  - Dette er en tracket upstream-risiko: patchen skal fjernes/gen-genereres når `@kirbydesign/core` udgiver en fikset version (den er kun 0.0.94, meget tidligt i sin levetid).
- [x] **Trin 6 — presentation-laget, del 1: `StatCard`.**
  - Klonede `kirbydesign/designsystem` lokalt til `/tmp/kirby-designsystem` for at kunne læse kildekode/eksempler direkte i stedet for at hente fil for fil via GitHubs API. Fandt undervejs deres eget officielle Claude Code-skill (`skills/consumer/SKILL.md`) med vejledning i hvordan man korrekt bruger biblioteket (per-komponent secondary entry points, undgå `KirbyModule`/barrel-imports, design-tokens) — værd at genbesøge/installere som skill i dette repo på et senere tidspunkt.
  - `presentation/components/stat-card/` — `StatCard`: en generisk, genbrugelig komponent (`label`, `value`, valgfri `sub`, `tone: 'positive' | 'negative' | 'neutral'`) bygget på den rigtige `CardComponent` fra `@kirbydesign/designsystem/card` (ikke `KirbyModule`, jf. deres eget skill). Bruger Kirbys indbyggede semantiske farve-tokens (`--kirby-text-color-positive/-negative/-semi-dark`) til plus/minus-farvning i stedet for selvopfundne farver.
  - Signal-baseret (`input()`/`input.required()`), `:host { display: contents }` så komponenten ikke forstyrrer et omgivende CSS-grid.
  - 2 tests, alle grønne — 40/40 i alt.
- [x] **Kirby-pakker pinnet til eksakte versioner** (`@kirbydesign/core`, `@kirbydesign/designsystem` uden `^`), efter en snak om at `^11.11.2` reelt allerede var låst til 11.11.2 via `package-lock.json` — men da vi allerede har måttet patche en bug i én af Kirbys pakker og accepteret en sårbarhed i en anden, pinner vi nu eksplicit for at undgå at en fremtidig `npm update` glider til en ny Kirby-version uden vi aktivt tager stilling.
- [x] **Trin 6 — presentation-laget, del 2: de 8 stat-cards på selve dashboard-siden.**
  - `presentation/formatting/number-formatting.ts` — rene, UI-lag-formatteringsfunktioner (`formatCurrency` — `da-DK`/DKK/0 decimaler, `formatPercentage` — fortegn + 2 decimaler + " %", `toneFor` — fortegn → `StatCardTone`). Hører til presentation, ikke domain, fordi det er ren visningslogik (jf. `fmt`/`fmtPct`/`colorClass` i `kirby.html`).
  - `presentation/dashboard-page/dashboard-stat-cards.ts` — `buildStatCards(overview: DashboardOverview | null): StatCardViewModel[]`, en **ren funktion** der mapper use-case-resultatet til de 8 kort (samme mønster som `buildOverview` i application-laget: al den rigtige logik ligger i en testbar, framework-uafhængig funktion, komponenten er bare tynd wiring). Returnerer 8 "—"-placeholder-kort når `overview` er `null` (før første data er hentet). 4 tests.
  - `presentation/dashboard-page/dashboard-page.ts` — henter `GetDashboardOverviewUseCase` via `inject()` (idiomatisk her, i modsætning til application/infrastructure — presentation er ikke omfattet af `@angular-eslint/prefer-inject`-undtagelsen), konverterer use-casens `Observable` til et signal med `toSignal(...)`, og udleder de 8 kort med `computed(() => buildStatCards(this.overview()))`. 2 tests (rigtige data + placeholder-tilstand), verificeret med en fake `GetDashboardOverviewUseCase` via DI — komponenten kender ikke til `DashboardRepositoryPort`/`BenchmarkRateProviderPort` direkte.
  - `app.routes.ts`: `''` peger direkte på `DashboardPage` som en midlertidig løsning, indtil landing-page (trin 7) findes.
  - 46/46 tests grønne, `npm run build`/`npm run lint` grønne, `ng serve` kompilerer og server siden (HTTP 200). **Stadig ikke verificeret i en rigtig browser** — samme begrænsning som tidligere.
- [x] **Trin 6 — presentation-laget, del 3: periode-selector, koblet reaktivt til dashboard-siden.**
  - `domain/models/period.model.ts`: tilføjet `periodEquals(a, b)` — strukturel sammenligning af `Period`-discriminated-union (nødvendig fordi to `{kind:'trailing-days', days:7}`-objekter ikke er `===` hinanden). 4 tests.
  - `presentation/formatting/period-label.ts` — `periodDescription(period)`: lang tekstform ("1 Week", "3 Months", "Year to date", "All history"), svarer til `labels`-opslaget i `filterAndRender()` i `kirby.html`. Bruges nu i "Data points in the period"-kortets undertekst (`af {total} total · {periodDescription}`), så den tidligere kendte forenkling er væk igen.
  - `presentation/components/period-selector/` — bygget på den rigtige `kirby-segmented-control` (mode `"chip"`, matcher kommentaren `/* Kirby "chip mode" segmented control */` i `kirby.html`) fra `@kirbydesign/designsystem/segmented-control`, med 7 valgmuligheder (1W/1M/3M/6M/1Y/YTD/All history) der hver bærer en `Period`-værdi. Kontrolleret udefra (`period` input, `periodChange` output) — ingen egen state. 2 tests, verificeret ved at trigge `kirby-segmented-control`s `segmentSelect`-output direkte via `fixture.debugElement`, uden at afhænge af Ionics interne DOM-rendering.
  - `dashboard-page.ts`: `period` er nu et rigtigt, skrivbart signal (default `{kind:'all'}`); brugte `toObservable(period).pipe(switchMap(...))` + `toSignal(...)` så use-casen genkøres reaktivt hver gang perioden ændres — i stedet for det tidligere engangs-abonnement på `execute({kind:'all'})`.
  - **Fandt og rettede endnu en pakke-bug**, denne gang i `@ionic/angular@8.6.3` (som Kirbys segmented-control bruger under motorhjelmen): samme mønster som Kirby-core-bugen — `fesm2022/{ionic-angular,ionic-angular-common,ionic-angular-standalone}.mjs` importerer `@ionic/core/components`/`@ionic/core/loader` som directory-imports uden `/index.js`. Rettet de 4 forekomster, fanget som `patches/@ionic+angular+8.6.3.patch`.
  - **Fandt og rettede to jsdom-miljøbegrænsninger** (ikke pakke-bugs denne gang, men reelle mangler i jsdoms browser-emulering) der crashede ethvert unit-test der rendrer et rigtigt `ion-segment`/`ion-segment-button` (Stencil-web-components): (1) jsdoms `attachShadow()` initialiserer ikke `shadowRoot.adoptedStyleSheets` som et array, selvom den ellers signalerer støtte for constructable stylesheets — Stencil crasher på `.push()` på `undefined`; (2) jsdom implementerer slet ikke `Element.prototype.scrollTo` (intet layout-engine), som `ion-segment` kalder for at scrolle den valgte knap i view. Løst med et nyt `src/test-setup.ts` (registreret via `angular.json`'s `test.options.setupFiles`, den officielle Angular-mekanisme til globale test-setup-filer) der patcher begge dele defensivt, kun i test-miljøet.
  - 52/52 tests grønne, build/lint grønne, `ng serve` kompilerer og server siden.
- [x] **Trin 6 — presentation-laget, del 4: `PortfolioChart` (graf).**
  - Fandt Kirbys dedikerede `kirby-stock-chart` (`@kirbydesign/designsystem/chart`, wrapper omkring Chart.js v3) — bevidst mærket "experimental" i deres egen kildekode, men er den rigtige komponent til et tidsserie-linjediagram, og matcher direkte de peer-dependencies vi allerede installerede (chart.js, chartjs-adapter-date-fns, chartjs-plugin-annotation, chartjs-plugin-datalabels). Fandt datapunkt-formatet (`{x: epochMs, y: value}[]` pr. dataset, ingen separat `labels`-array) via deres cookbook-eksempler, ikke gættet.
  - `presentation/components/portfolio-chart/portfolio-chart-datasets.ts` — `buildChartDatasets(entries, benchmarkLine, trendLine)`: ren funktion der bygger 1-3 Chart.js-datasets (portefølje altid, benchmark/trend kun hvis givet), svarer til `buildChart()` i `kirby.html` (samme farver/stiplede linjer: portefølje grøn med fill, benchmark orange stiplet, trend rød stiplet). 5 tests.
  - `presentation/components/portfolio-chart/portfolio-chart.ts` — tynd wrapper om `<kirby-stock-chart [data]="datasets()">`, tager `entries`/`benchmarkLine`/`trendLine` som inputs (kender intet til use-cases/porte).
  - `dashboard-page.html`: graf + periode-selector samlet i en rigtig `<kirby-card>`, ligesom `.chart-container.kirby-card` i `kirby.html`. `benchmarkLine`/`trendLine` bindes fra `overview().period`, men er altid `null` lige nu, fordi use-case-kaldet stadig ikke sender `{benchmark, includeTrend}`-options — benchmark-dropdown og trend-toggle er separate UI-stykker der ikke er bygget endnu (naturlig næste opgave).
  - **Fandt og rettede en tredje pakke-bug**, denne gang i **`chart.js@3.9.1` selv** (ikke en Kirby/Ionic-pakke): ingen `"exports"`-felt i `package.json`, så et bart `import ... from 'chart.js/helpers'` (brugt af Kirbys chart-bundle) ramte samme directory-import-problem som før. Løsningen er anderledes denne gang: i stedet for at rette den enkelte importlinje, tilføjede vi et korrekt `"exports"`-felt til `chart.js`s eget `package.json` (`.`, `./auto`, `./helpers`, `./package.json`, hver med `import`/`require`-betingelser mod de rigtige `.mjs`/`.js`-filer) — den rigtige, generelle fix, der gør alle bare subpath-imports korrekte på én gang. Fanget som `patches/chart.js+3.9.1.patch`.
    - Lærte undervejs at `patch-package` som **standard ekskluderer `package.json`-ændringer** (`--exclude 'package\.json$'`), og at `--exclude ''` er en fælde (tom regex matcher alt, så intet fanges) — skal bruge et garanteret ikke-matchende mønster for at inkludere `package.json` i en patch.
  - **Fandt og rettede endnu en jsdom-miljøbegrænsning:** jsdom implementerer slet ikke `ResizeObserver`. Kirbys egen `ResizeObserverService` tjekker for det og degraderer nådigt (`null`-check), men `kirby-stock-chart`s `BaseChartComponent` gør ikke — den crashede ved `.observe()` på `null`. Tilføjet en no-op `ResizeObserver`-stub i `src/test-setup.ts`.
  - 57/57 tests grønne, build/lint grønne, `ng serve` kompilerer og server siden.
- [x] **Trin 6 — presentation-laget, del 5: benchmark-dropdown + trend-toggle.** Lukker hullet fra sidste del — grafen viser nu rigtige benchmark-/trend-linjer.
  - `presentation/components/benchmark-picker/` — bygget på den rigtige `kirby-dropdown` fra `@kirbydesign/designsystem/dropdown`, 5 valg med samme tekst som `<option>`-elementerne i `kirby.html` ("MSCI World (~10% p.a.)" osv.). Samme mønster som `period-selector`: kontrolleret udefra (`benchmark` input, `benchmarkChange` output), 2 tests verificeret via `kirby-dropdown`s `change`-output direkte på `fixture.debugElement`.
  - Trend- og benchmark-toggle er lavet direkte med den rigtige `kirby-toggle` (`@kirbydesign/designsystem/toggle`) i `dashboard-page.html` — ingen egen wrapper-komponent, da et enkelt boolean-flag ikke har nogen logik der er værd at abstrahere (i modsætning til periode/benchmark, som begge har en mapping mellem UI-valg og domænetype).
  - **Bevidst bibeholdt to separate kontroller** (toggle for til/fra + dropdown for hvilket benchmark), ligesom `kirby.html`, i stedet for at forenkle til én dropdown med et "Fra"-valg — for at blive tættere på originalens interaktionsmønster, i tråd med hvordan periode-selectoren også bevarede alle 7 enkelte valg i stedet for at blive lagt sammen.
  - `dashboard-page.ts`: `benchmarkEnabled`/`benchmark`/`trendEnabled` er nu skrivbare signaler, samlet i et `request`-computed-signal og sendt til use-casen via `toObservable(request).pipe(switchMap(...))` — samme reaktive mønster som periode. `{benchmark: enabled ? valgt : undefined, includeTrend}` sendes nu rent faktisk med, så `period.benchmarkLine`/`trendLine` ikke længere altid er `null`.
  - Tilføjet et `kirby-badge` der viser `periodDescription(period())` i chart-toolbaren, ligesom `#periodBadge` i `kirby.html`.
  - **Fandt og rettede en tredje jsdom-miljøbegrænsning:** `ion-icon` (bruges af `kirby-dropdown`s pil-ikon) henter sit SVG-indhold med `fetch()` ved runtime. En relativ sti (`assets/kirby/icons/svg/arrow-down.svg`) kan ikke blive en gyldig URL uden en side-origin, som jsdom ikke giver i dette testmiljø — `fetch` kastede `ERR_INVALID_URL`. Løst med endnu en tilføjelse i `src/test-setup.ts`: en `fetch`-wrapper der returnerer et tomt SVG-svar for alle relative stier, i stedet for at ramme et rigtigt (og i praksis ikke-eksisterende) netværkskald.
  - 59/59 tests grønne, build/lint grønne, `ng serve` kompilerer og server siden.
- [x] **Trin 7 — landing-page (slide-to-unlock) + rigtig routing.**
  - Fandt Kirbys `kirby-slide-button` (`@kirbydesign/designsystem/slide-button`) — en `<input type="range">`-baseret slide-to-unlock-komponent med indbygget tilgængelighed (skjult knap som klik-fallback). Langt simplere end den håndrullede pointer-drag-implementering i `kirby-landing.html`; API er bare `[text]`, `(slideDone)`.
  - `presentation/landing-page/` — splash-side med samme indhold som `kirby-landing.html` (eyebrow, titel, undertekst, fodnote), men baggrundsgradienten bruger nu Kirbys egne brand-tokens (`--kirby-tertiary/-secondary/-primary`) i stedet for hardcodede Jyske-hex-farver — de er faktisk næsten identiske grønne, så det visuelle resultat er stort set uændret. `(slideDone)` navigerer til `/dashboard` via `Router.navigateByUrl`. 1 test, verificeret ved at trigge `kirby-slide-button`s `slideDone`-output og spionere på en overstyret `Router`-provider.
  - `app.routes.ts`: `''` → `LandingPage`, `'dashboard'` → `DashboardPage` (den midlertidige direkte-til-dashboard-rute fra trin 6 er væk).
  - **Fandt og rettede en selvforårsaget bug i `proxy.conf.json` fra trin 5:** nøglen var `"/dashboard"` (uden efterfølgende slash), som i Angular CLI's proxy-middleware matcher som præfiks — det fangede derfor **også** vores egen nye `/dashboard`-SPA-rute og videresendte den fejlagtigt til den rigtige backend (som naturligvis ikke har en almindelig side der, kun `/dashboard/data` — gav 404 fra en rigtig Kestrel-server). Fundet ved at teste ruterne direkte med `curl` mod `ng serve` (ikke gættet — det krævede at følge `server: Kestrel`-response-headeren for at forstå at requesten reelt blev proxy'et videre). Rettet til den præcise sti `"/dashboard/data"`. `nginx.conf.template`s produktions-regel var allerede korrekt i kraft af en efterfølgende slash (`location /dashboard/ { ... }`, som ikke matcher den nøgne `/dashboard`), men dev-proxyen havde ikke samme beskyttelse.
  - Verificeret direkte mod `ng serve`: `/` → 200 (landing), `/dashboard` → 200 (Angular SPA-fallback, ikke længere proxy'et), `/dashboard/data` → 200 med rigtigt JSON fra den ægte backend (`192.168.1.239:5151` var faktisk tilgængelig fra dette miljø).
  - 60/60 tests grønne, build/lint grønne.
- [x] **Trin 8 — Docker-build + end-to-end mod rigtig backend.**
  - **Fandt og rettede en reel bug i `Dockerfile`:** `patches/`-mappen blev ikke kopieret ind før `RUN npm ci` — `patch-package`s `postinstall`-hook (som anvender alle tre patches fra trin 6) ville derfor fejle midt i en rigtig Docker-build, selvom alt så fint ud lokalt (hvor `node_modules`/patches allerede lå på disk). Tilføjet `COPY patches ./patches` før `npm ci`.
  - Byggede det rigtige multi-stage image lokalt (`docker build`), kørte det (`docker run`), og testede de tre kritiske stier direkte mod den kørende container (ikke bare `ng serve`): `/`, `/dashboard`, `/dashboard/data`.
  - **Fandt og rettede en mere fundamental fejl i `nginx.conf.template`:** `location /dashboard/` (præfiks, for at proxy'e til backend) kolliderer med vores egen `/dashboard`-SPA-rute på en måde jeg ikke havde forudset. Da en bruger besøger `/dashboard` direkte (uden efterfølgende slash — fx et bogmærke, et genindlæst faneblad, eller bare at skrive URL'en), forsøger `location / { try_files $uri $uri/ /index.html; }`s `$uri/`-fallback sig med `/dashboard/`, og fordi *den* sti rent faktisk matcher proxy-location'en, udløser nginx sin indbyggede "tilføj afsluttende slash og redirect"-adfærd (301) — hvorefter det efterfølgende (redirected) kald til `/dashboard/` bliver proxy'et til backend i stedet for at vise Angular-appen. Verificeret empirisk trin for trin (fjernede/gendannede dele af configen i den kørende container) i stedet for at gætte.
    - **Fix:** ændret fra en præfiks-location (`/dashboard/`) til et eksakt match (`location = /dashboard/data`), som kun matcher den ene, konkrete API-sti og ikke deltager i `try_files`s slash-normaliserings-logik. Samme grundfejl som proxy.conf.json-bugen fra trin 7 — begge stammer fra at lade API-proxyens sti dele præfiks med vores egen SPA-rute.
  - Genbyggede og gentestede: `/` → 200, `/dashboard` → 200 (Angular, ikke proxy'et), `/dashboard/` → 200, `/dashboard/data` → 200 med ægte JSON fra backend på `192.168.1.239:5151`.
  - Endelig lokal verificering: `npm run build`, `npx ng test --watch=false` (60/60), `npm run lint` — alle grønne.

## Nuværende status i stockPriceFrontend

Alle 8 trin i roadmap'en ovenfor er gennemført. Appen er en fuld, virkende port af `kirby.html`/`kirby-landing.html`, bygget med rigtige `@kirbydesign/designsystem`-komponenter (Angular 21 + Ionic), onion-lagdelt (`domain` → `application` → `infrastructure`/`presentation`), og verificeret både som `ng serve` og som det rigtige Docker-image mod den ægte backend.

- Angular 21.2.24 (nedgraderet fra 22 for at kunne bruge den ægte, Ionic-baserede Kirby-pakke — se trin 6), standalone, signals, zoneless. 60 unit-tests (Vitest), alle grønne. ESLint sat op og grøn, både lokalt og i CI.
- Tre patch-package-patches (`patches/`) retter pakke-bugs i `@kirbydesign/core`, `@ionic/angular` og `chart.js` — alle upstream, alle dokumenteret ovenfor med begrundelse. Genanvendes automatisk via `postinstall`.
- `src/test-setup.ts` polyfiller fire ting jsdom ikke selv understøtter (shadow-DOM `adoptedStyleSheets`, `Element.scrollTo`, `ResizeObserver`, relative `fetch`-kald til ikon-SVG'er) — nødvendigt for at kunne unit-teste rigtige Ionic/Stencil-web-components.
- Docker-imaget er bygget og kørt lokalt mod den ægte backend (`192.168.1.239:5151`) med succes — se trin 8 for de to bugs (Dockerfile + nginx) det afslørede, som `ng serve`/lokale tests ikke kunne fange.
- Ikke gjort: rigtig browser-test (ingen browser tilgængelig i dette miljø, kun `curl`/jsdom). CI/CD-pipelinen (`.github/workflows/main.yml`) håndterer selve deploy til produktion ved push til `master`.

## Beslutningslog

- 2026-09-25: Onion-lagdeling valgt frem for feature-mapper, fordi mest af kompleksiteten i legacy-koden er ren beregningslogik der bør isoleres fra Angular/UI for testbarhed og genbrug.
- 2026-09-26: `infrastructure/inbound` og `application/ports/inbound` droppet (YAGNI) — der er ingen konkret, ikke-UI-drevet trigger i appen lige nu. Genoverveje hvis vi senere får deep-linking, websockets eller polling, der driver appen udefra.
- 2026-09-26: Ingen README-stubs i lag-mapperne — al arkitekturdokumentation samles i denne fil (PROJECT.md) i stedet for spredt ud i koden.
- 2026-09-26: Angular 22 → 21 nedgraderet for at kunne bruge den fulde, ægte `@kirbydesign/designsystem` (Ionic-baseret) i stedet for hånd-bygget Kirby-inspireret CSS — brugerens eksplicitte valg efter at have fået begge alternativer og deres pris præsenteret.
- 2026-09-26: Kirby-pakkeversioner pinnet eksakt (uden `^`) efter at vi havde måttet patche en bug i én af dem og acceptere en sårbarhed i en anden — for at undgå at en fremtidig `npm update` glider til en ny, endnu ikke undersøgt version.
- 2026-09-26: API-proxy-stier (både `proxy.conf.json` og `nginx.conf.template`) skal altid være et **eksakt match** på den konkrete backend-sti (`/dashboard/data`), aldrig et præfiks (`/dashboard/`) — fordi appens egen SPA-rute (`/dashboard`) deler præfiks med API-namespacet, og præfiks-matching (i både Angular's dev-proxy og nginx's `try_files`) fejlagtigt fanger SPA-ruten. Vigtigt at huske hvis flere backend-endpoints tilføjes under `/dashboard/*` senere.
