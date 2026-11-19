# Providers & Models Draft

## 1. Document status

- Stage: AMS Redesign STEP F
- Status: team-review frontend prototype
- Updated: 2026-11-19
- Runtime: Angular 19, local Mock Data only

This document describes the Providers & Models prototype used to discuss screen
structure, fields, and how Provider and Model records relate to Product AI
Configuration. It does not define live provider connections, credential
storage, request routing, cost, or Rate Cards.

Sample names, codes, and endpoints are arbitrary review values. They are not
confirmed current AMS operating policy, and they are not production endpoints.

## 2. Providers & Models IA

- One menu: `/providers-models`
- Sidebar group: AI Operations
- Tabs: `Providers` (default) and `Models`
- List tab query: omit `tab` for Providers, `tab=models` for Models
- Provider detail route: `/providers-models/providers/:providerId`
- Provider detail section query: omit `section` for Overview, `section=models`,
  `section=products`
- No Model detail route. Model detail is a dialog
- No Provider Activity tab
- Switching the main tabs replaces the query with that tab's default list
  state, so browser Back restores the previous tab and its filters
- Opening a Provider from the list copies the list query and stores the Models
  tab as `listTab=models`. Detail uses `section`, so the list tab is not
  overwritten. Breadcrumb and `목록으로` map `listTab` back to `tab`
- Page size is fixed at 10, matching Organizations, Users, Products, and
  Plans & Points

Providers and Models are master records. Product Action Code mappings stay on
Products → AI Configuration. This screen reads those mappings and does not add,
edit, or remove them.

## 3. Providers list

Page title: `Providers & Models`

Description: `AI Provider, Model, 제품 연결을 관리합니다.`

Primary action: `Provider 추가`

Summary, calculated from the full shared Provider catalog:

- Total Providers
- Active Providers
- LLM Providers
- Non-LLM Providers

Search matches Provider Name and Provider Code. Filters are Provider Type
(`전체 유형`, `LLM`, `Non-LLM`) and Status (`전체 상태`, `활성`, `비활성`).
Combined filters, sort, and pagination work on the same list. `필터 지우기`
appears when a search or filter is active.

Columns: Provider, Provider Code, Type, Models, Connected Products, Status,
Updated At, Actions.

The Provider cell shows the name and description. There is no logo. The name
opens Provider detail. Row click does the same.

Models is the count of models whose `providerId` matches. Connected Products
is the count of distinct products that have any ProductModelMapping for this
provider. Inactive mappings are included. This is a display rule for the
prototype, not a decision about whether an inactive mapping is operationally
connected.

Actions: `상세`, `수정`, `활성화` / `비활성화`. There is no delete action.

Empty copy: `등록된 Provider가 없습니다.`

No-results copy: `조건에 맞는 Provider가 없습니다.`

## 4. Provider detail

The page follows the Organization and Product detail pattern without an avatar
or logo.

Breadcrumb: `Providers & Models / [Provider Name]`

Title is the Provider name. Subtitle is the Provider Code. The status badge is
`활성` or `비활성`. Header actions are `수정` and `활성화` / `비활성화`.

Summary:

- Registered Models
- Active Models
- Connected Products

Tabs: Overview, Models, Products. Overview is the default.

### Overview

Basic Information: Provider Name, Provider Code, Type, Status, Created At,
Updated At, Description.

Connection Settings:

- API Endpoint, or an em dash when empty
- Authentication: `Mock / Not Connected`
- API Key: `••••••••mock`
- Connection Status: `Not Tested`

The card includes `Demo configuration only. No live API connection.` There is
no Test Connection button, and the screen does not show Connected or Healthy.

Related Configuration shows Registered Models and Connected Products. Each
control opens the matching detail tab.

### Models

Only models for the current provider. The section action is `Model 추가`, and
the dialog keeps this provider selected. Columns: Model, Model Code, Model
Type, Status, Connected Products, Actions. Actions are view, edit, and
activate / deactivate. Empty copy: `등록된 Model이 없습니다.`

### Products

One row per ProductModelMapping whose provider is the current provider.
Columns: Product, Action Code, Model, Mapping Status, Product Status, Actions.
The action is `설정 보기`. It opens Product detail on AI Configuration
(`tab=configuration`, and `ai=non-llm` when the provider kind is non-llm).
Empty copy: `연결된 제품이 없습니다.`

## 5. Models list

Primary action: `Model 추가`

Summary, calculated from the full shared Model catalog:

- Total Models
- Active Models
- Inactive Models

Search matches Model Name and Model Code. Filters are Provider, Model Type
(`LLM`, `Non-LLM`), and Status. Combined filters, sort, and pagination work
on the same list.

Columns: Model, Model Code, Provider, Model Type, Connected Products, Status,
Updated At, Actions.

The Model cell shows the name and description. The Provider name opens
Provider detail. Connected Products is the count of distinct products mapped
to that model, including inactive mappings.

Row click and `상세` open the Model detail dialog.

Empty copy: `등록된 Model이 없습니다.`

No-results copy: `조건에 맞는 Model이 없습니다.`

## 6. Model detail

Model detail is a dialog so it can later become a page if the team needs more
analysis. It shows Model name, code, provider, type, description, status,
created date, updated date, and connected products.

Connected product rows show Product, Action Code, and Mapping Status. The
product name opens Product detail on AI Configuration.

Actions: `수정` and `활성화` / `비활성화`. Rate Card and cost fields are not
shown.

## 7. Add and edit forms

### Add Provider

Sections: Basic Information, Connection Settings.

Fields: Provider Name, Provider Code, Provider Type (`LLM` or `Non-LLM`),
initial status, optional description, optional API Endpoint, and a read-only
API Key display.

Initial status defaults to `비활성`. That default is a prototype assumption.
The user can choose `활성` before the first save.

API Endpoint accepts a sample string and is not called. The API Key field is
fixed to `••••••••mock` and is not part of the saved record. The form tells
the reviewer not to enter a real key.

Validation: name, code, and type are required. Code is stored uppercase and
must be unique across the Provider catalog, compared without case.

### Edit Provider

Name, description, and endpoint can change. Code and type are read-only.
Status stays on the separate activate / deactivate action. The existing
Provider id and its mappings stay in place. A renamed provider appears with
the new name on the list, the detail page, and Product mapping rows.

### Add Model

Fields: Provider, Model Name, Model Code, Model Type, optional description,
initial status. Initial status defaults to `비활성`.

The provider list comes from the shared catalog. From Provider detail, the
current provider is filled in and cannot be changed in that dialog.

Model Type is not a separate taxonomy. The current catalog only has `llm` and
`non-llm`, and a new model copies the selected provider's kind. The field is
read-only once a provider is selected. The prototype does not invent a finer
model classification.

Model Code is stored uppercase. Uniqueness is checked across the whole Model
catalog. Whether a real system should enforce uniqueness globally or per
provider is unconfirmed. The global check is a temporary prototype rule.

### Edit Model

Name and description can change. Code and provider are read-only. Kind stays
the provider's kind. Status stays on the separate action. Saving does not
create or delete mappings. A renamed model appears with the new name on the
list, the detail dialog, and Product mapping rows.

## 8. Status management

Three statuses stay separate:

- Provider status: `active` or `inactive`
- Model status: `active` or `inactive`
- Mapping status: `active` or `inactive`

Deactivate asks for confirmation and reports how many distinct products are
linked. The copy says the models and mappings remain and that real requests
are not blocked. Activate applies immediately and shows a toast, matching the
Plans prototype.

Making a provider or model inactive does not rewrite or remove mapping rows.
Product AI Configuration still lists the mapping and adds `· 비활성` on the
provider and model selects, plus `Provider 비활성` or `Model 비활성` under
the name in the mapping table. The mapping badge itself does not change.

An inactive mapping does not change the provider or model status.

This screen does not decide whether an inactive provider or model blocks a
live product request.

## 9. Product integration

Products → AI Configuration and this screen read the same `ProductsStore`
catalog. There is no second provider or model store.

Checked relationships:

- A provider added here is available in the Product mapping provider select
- A model added here is available in the Product mapping model select for its
  provider and kind
- Renaming a provider or model updates the names shown on Product mappings
- Deactivating a provider or model leaves the mapping row and shows the
  inactive catalog state beside the mapping status

`providersFor` and `modelsFor` still return inactive records, so an inactive
provider or model can still be selected. The inactive label is informational.
Selecting one does not change its catalog status and does not imply that a
live request would succeed.

Provider detail does not duplicate mapping create, edit, or remove.

## 10. Shared mock data

The STEP D catalog in `ProductsStore` was extended in place. Existing ids are
unchanged:

- Providers: `provider-openai`, `provider-anthropic`, `provider-google`,
  `provider-sample-vision`, `provider-sample-speech`
- Models: `model-gpt-41`, `model-gpt-41-mini`, `model-claude-sonnet`,
  `model-gemini-25`, `model-sample-vision`, `model-sample-speech`
- Mappings: `mapping-0001` through `mapping-0005`

Provider fields: id, name, code, kind, description, endpoint, status,
createdAt, updatedAt. No API key field is stored.

Model fields: id, providerId, name, code, kind, description, status,
createdAt, updatedAt.

Seeded providers and models are active so the existing mappings are not
pre-deactivated. Codes are temporary sample values such as `TMP-OPENAI` and
`TMP-GPT-41`. Endpoints use `https://mock.example/...`. Descriptions say the
code and endpoint are temporary and do not mean a live connection.

New ids still use the existing `nextId` helper. A new provider becomes
`provider-0001` because the seeded provider ids contain no digits. A new
model continues from the digits already present in model ids.

The in-memory catalog resets when the browser reloads the application. Shared
updates are visible only inside one session.

## 11. Mock interaction

Working in the prototype:

- Provider and model search, combined filters, sorting, and pagination
- Add, edit, and view
- Activate and deactivate, with confirmation only for deactivate
- Provider detail tabs and navigation back to the list
- Add model from a provider, with that provider preset
- Open the related Product AI Configuration
- Form validation, cancel, toast, empty state, and no-results state
- Shared catalog updates inside the same session

Not represented as working behavior:

- Saving or replacing an API key
- Calling an endpoint or testing a connection
- Provider or model delete and restore
- Moving a model to another provider
- Changing provider type after creation
- Changing model type independently of its provider
- Mapping edits from this screen
- Rate Cards, token or cost calculation, routing, fallback, or health checks

## 12. Confirmed from the existing AMS prototype

- AI Operations already had the Providers & Models menu and the Providers /
  Models tab ids
- STEP D already had Provider, Model, Action Code, Product, and
  ProductModelMapping in one store
- Provider kind was already only `llm` or `non-llm`
- Model records already belonged to one provider and used the same kind
- Product detail already used `tab=configuration` and `ai=non-llm`
- List chrome, page size 10, fixed action menus, and dialog close placement
  already matched the dashboard and later management screens
- The header breadcrumb already had a chain for organization, product, and
  user. Provider detail was added in that same pattern

## 13. Proposed UX in this prototype

- Provider detail is a page. Model detail stays a dialog
- Provider code and type are immutable after create
- Model code and provider are immutable after create
- Model type is derived from the provider kind
- New providers and models default to inactive
- API key is a masked demo and is never collected
- Connection status stays `Not Tested`
- Inactive catalog status is shown next to Product mappings without changing
  the mapping status
- Connected product counts include inactive mappings
- Deactivate confirms and names the linked product count. Activate does not
  confirm
- List return state uses `listTab` so detail `section` does not collide with
  the list `tab` query

These choices are review proposals.

## 14. Team review

- What Provider Code and Model Code identify, and who can change them
- Whether Model Code must be unique globally or only within a provider
- Whether Provider Type and Model Type need a taxonomy beyond LLM / Non-LLM
- Whether provider type can change after models or mappings exist
- Whether a model can move to another provider after mappings exist
- How API keys and endpoints are stored, rotated, and audited
- What inactive provider, inactive model, and inactive mapping each do to a
  live product request
- Whether an inactive provider or model may still be selected on a product
- Whether Connected Products should ignore inactive mappings
- Delete, archive, and restore rules for providers and models
- Whether Provider detail needs an activity or audit tab
- Whether Model detail should become its own page
- How this catalog should connect to Usage & Costs Rate Cards later
- The existing Action Code model selection and fallback behavior

## 15. Development review

- The catalog lives in `ProductsStore`. A second store would split Product
  mapping names from this screen
- No API key property exists on the provider record. Do not add a secret field
  to the mock in order to make the masked input look saved
- `providersFor` and `modelsFor` do not filter by status. Product selects
  depend on that
- Rename and status methods do not write mapping rows. Display names are read
  through `providerName` and `modelName`
- `nextId` is shared with products, action codes, and activities. Do not
  change it only to make provider ids look sequential
- Full navigation reloads the dev server document and resets the in-memory
  catalog. Session checks have to stay on in-app navigation
- List query key `tab` and detail query key `section` must stay distinct
- Page size is hard-coded at 10
- This prototype does not call `fetch`, store credentials, or add a connection
  test control
