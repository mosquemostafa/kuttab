# Modawim Project Todos

## Bugs & Fixes

- [ ] can we make fcm reach the user as native notificatoin even if he have the app open , or even have better custom handling for it instead of the normal toast
- [ ] can we auto label the fcm tokens or this should happen by the user
- [ ] combine the context depdning on session storage with ttl to ensure refresh period
- [ ] remove hover effects movements in cards in main page
- [ ] Fix refetching on change view from list to kanban
- [ ] Emails got sent even when email verification is not used
- [ ] Direction in bread crumbs not loading
- [ ] Handle the load more tasks
- [ ] Fix notes archive mode
- [ ] Solve the so many request .js problems found in dev tool
- [ ] Fix large notes scroll bar
- [ ] Fix flickering in journal image when having slider
- [ ] Fix subscriptoin context sometimes not working and user have to open new tab because of the session storage problem (maybe introdude try again that force fetch)
- [ ] In books validate the satrtAt and endDate comparasion for each entry
- [ ] Fix mobile modal 1 pixel x margin
- [ ] Fix the search اخر نداء لطائرة
- [ ] See why user start their app in english
- [ ] Layout shift in browser extension in youtube tab

## Performance, Refactoring & Code Quality

- [ ] Refactor types
- [ ] Refactor fetch api
- [ ] Refactor the actions.ts thing which don't use the api client
- [ ] Code review over this shit
- [ ] Add indexes
- [ ] Handle habits, journals pagination, indexing
- [ ] Handle the pagination action plan
- [ ] Why build time after sanity increases ?
- [ ] Handle performance and handle habits network optimization
- [ ] Handle sessions stack in storage
- [ ] Handle things that uses large limit like limit of tags store (better using a fetch on search method)
- [ ] Create a plan to reduce file sizes so max one is like 400 line
- [ ] Add clear cache and storage route
- [ ] Unify color key is nullable
- [ ] Rename all emoji fields to icons
- [ ] Rename all color to colorKey
- [ ] Handle adding next link to the guidelines
- [ ] Add Playwright testing

## Habits Module

- [ ] Habits preferences
  - [ ] Complete sound
  - [ ] Calender type
  - [ ] Show motivation note
  - [ ] Week start day
- [ ] Habits reorder
- [ ] Test reorder
- [ ] Reorder
- [ ] Test repetition modes
- [ ] Complete all in weekly
- [ ] Habit streak (streak not now / habit streak)
- [ ] Habit page analytics / Habit analytics page
- [ ] Random quote feature

## Todos & Projects

- [ ] Enhance the list of the project representation
- [ ] Use Zustand for projects state
- [ ] Handle the project context and memory
- [ ] Handle the archive page and project page for list
- [ ] Handle the edit and create modal to have more functionalities
- [ ] The show more button for tasks
- [ ] Make if project filter applied in todos handle the project picker to match
- [ ] Add progress bar for today tasks
- [ ] Add todo notes because i may want to describe the task in details or include some url that will help me accomplish this task
- [ ] Add list view bulk action like delete multiple videos

## Journals & Notes

- [ ] Make create input as search bar at the same time in the journals
- [ ] Journal having: word count, isFavorite, sleeping hours, excerpt
- [ ] Add journals analytics
- [ ] Add journals export
- [ ] Add journal single md export
- [ ] Enable custom templates in local storage in the journals
- [ ] Auto delete note feature
- [ ] Notes preferences (like auto choose random color) or default color

## Calendar & Planning

- [ ] Calendar & events logic (problematic places):
  - [ ] Calender events collision handling
  - [ ] Calender events expansion logic
  - [ ] Calender events time line logic and prayer times
  - [ ] Calender drag events feature and phone touches
- [ ] Add yearly recurring events or recurring every 3 month or 6 monthes
- [ ] Add new planning view (different views: year -> 4 quarters / 12 months -> month -> 4 weeks)
- [ ] Make each plan have some goals
- [ ] Make goals appear in the plan page
- [ ] Make current plan appear in calender
- [ ] Add projects linking to planning
- [ ] Remove the project and goals template sections

## Tags, Resources & Books

- [ ] Add tags system to notes and habits
- [ ] Handle delete a tag removing all usage of this tag
- [ ] Remove tags colors (extra not needed complexity - i think removing the tags color will make the process much much easier)
- [ ] Handle the books filter by tag filter list only show tags that does exist on books
- [ ] Add resources
- [ ] Add resource type for the social media post
- [ ] Add second brain revision logic to modawim learning workspace
- [ ] Add optimistic ui in lesson complete (maybe)
- [ ] Educations reels section

## Notifications & Reminders

- [ ] Add reminders
- [ ] Add a test my notifications button
- [ ] Make FCM notification have sound
- [ ] Show the prayer reminder option in the custom notifications
- [ ] Handle resend activation
- [ ] Pre-subscription end reminder: handle sending the user notification + email when and before his subscription ends

## Overview, Dashboard & Gamification

- [ ] Handle overview dashboard
- [ ] Overview page
- [ ] Handle the overview dashboard and quick actions
- [ ] Implement modawim challenges in the daily overview page
- [ ] Handle XP and gamification

## UI/UX & Keyboard Shortcuts

- [ ] UI colors and UX
- [ ] Remove borders and paddings from container cards in mobile screens
- [ ] Handle different screen heights
- [ ] Add shortcut for save (Cmd+S to save using keyboard)
- [ ] Make all date pickers act also as input for fast inputting date not swipe
- [ ] Tool kit like a timer or countdown (e.g. countdown feature like end of the year)

## Authentication, User Management, Billing & Support

- [ ] Return subscription to context so no one can access it from local storage
- [ ] Payment system
- [ ] Handle customer support for not logged users

## Infrastructure, Security, DevOps & Analytics

- [ ] Add complete monitoring system to modawim
- [ ] Add Nginx rate limiting in the VPS
- [ ] Update DB passwords
- [ ] Add Cloudflare captcha
- [ ] Create auto segmentation system job
- [ ] Handle pages indexing: https://search.google.com/search-console/index/drilldown?resource_id=sc-domain%3Amodawim.com&item_key=CAMYFiAC
- [ ] Make sure that Google Analytics adds the page titles

## Marketing, SEO & Growth

- [ ] create a video that tells my story with productivity tools and how i created modaim
- [ ] Add my brand marketing links DB
- [ ] Add marking tools in the markdown
- [ ] https://www.bing.com/webmaster/tools/contentremovalform/ShowAnonymousPage
- [ ] https://posthog.com/pricing
- [ ] Create a link stream system like https://linkstream.io/
- [ ] Handle the UX writing of the website
- [ ] Handle topics
- [ ] Make a better customized OG image for modawim
- [ ] Add random popup to take user opinion and review about modawim

## Product Tour & Onboarding

- [ ] Onboarding and product tour
  - [ ] Make user created with initial task
- [ ] Product tour
- [ ] Add install PWA to page settings page

## Ideas & Backlog

- [ ] Add intentions library to modawim
- [ ] Financial goals
- [ ] Bulk import feature with AI commands
- [ ] Copy and paste in ChatGPT
- [ ] Main missing features in modawim (notification, import/export, marketing pipeline, product tour and videos)
- support excldrawer in modawim
- [ ] add comunites with idea of we track each other progress and ask about each other and we have ranking and so on

### checklist SEO & GEO

- [ ] https://isitagentready.com/
- [ ] https://cloudflare-experiments.com/docs/experiments/ai-bot-visibility
- [ ] https://search.google.com/search-console/index?resource_id=sc-domain%3Amodawim.com
- [ ] https://app.tasadr.ai/questions/gap

### Notifications

- daily quote (rucurring job + quotes table)
- todo reminder (specific time)
- habit reminder (recurrning reminder)
- calender events reminders (specific time)
- daily todo summary (every day at specific time as motiviation + analytics)
- subscriptin renew and expiry reminder
- planning notifications (remind me to create a weekly plan and monthly plan and daily plan)
- a plan can have option like (remind me to review this yearly plan every 2 weeks)
- remind me to journal everyday at specific time
- when a goal dedline comes
- remind me when a course or a book or video deadline is near
- ability to create custom reminders like the reminders page you had in notion (remind me every 2 days to do something)

### advanced notifications

- we miss you notifications like doulingo
- don't break your streak notifications
- motiviate users that didn't renew subscription for a while
- knowledge revision system (like a book spaced repetation settings and it reminds you to reed of the book - use second brain book strategy)
- ability to convert a notification saying like make sure to review that book into a real todo (so each notification have cta automiclly does its job on user confirm)

- should we have habits jobs postgress table or we simply use redis and a single sync job that runs like every day and make sure all habits have recurring jobs

- auto fill book details based on the book name

- make the editor have auto shortcur in all places to save by clickig save button

- remove light fonts

- handle today event timline algorithm

- fix i18n alley

- handle the default writing direction when user didn't type anything yet

- add og image to the course lesson public page

- fix landing page nav flickering

- remove the extra toggle button at ar/dashboard-learning/courses/courseId/lessons/lessonId and enough with the main toggle dashboard

- fix plan id page saying the total period of a weekly plan is 6 days instead of 7

- in habit create form add link to the intententions library https://nawaya.life/

- try to introduce things like the pages you had in notion like from here we start or my pillars

- add search on course material , book material
- add application general search

- add the complete journal template

- fix tables auto direction in the rich text display

do we fetch the session of the user with every request ?
GET /ar/dashboard/planning 200 in 23.4s (next.js: 14ms, proxy.ts: 3ms, generate-params: 2ms, application-code: 23.4s)
[UnhandledException] Error: Failed query: select count(\*) from "planning" where ("planning"."user_id" = $1 and "planning"."start_date" <= $2 AND "planning"."end_date" >= $3)
params: YfW1DzGmdvAlFKiVCN6Kcq4WsC0FlbBA,2026-12-31,2026-01-01
at async Object.findManyByUserId (src/server/modules/planning/planning.repository.ts:148:36)
at async Object.listPlannings (src/server/modules/planning/planning.service.ts:196:34)
at async Object.list (src/server/modules/planning/planning.controller.ts:67:20)
at async (src/server/decorators/with-error-handler.ts:11:14)
146 | const orderBy = getPlanningOrderBy(filters.sortBy);
147 |

> 148 | const [plannings, totalRows] = await Promise.all([

      |                                    ^

149 | db
150 | .select()
151 | .from(planning) {
query: 'select count(\*) from "planning" where ("planning"."user_id" = $1 and "planning"."start_date" <= $2 AND "planning"."end_date" >= $3)',
params: [ 'YfW1DzGmdvAlFKiVCN6Kcq4WsC0FlbBA', '2026-12-31', '2026-01-01' ],
[cause]: Error: Connection terminated unexpectedly
at async Object.findManyByUserId (src/server/modules/planning/planning.repository.ts:148:36)
at async Object.listPlannings (src/server/modules/planning/planning.service.ts:196:34)
at async Object.list (src/server/modules/planning/planning.controller.ts:67:20)
at async (src/server/decorators/with-error-handler.ts:11:14)
146 | const orderBy = getPlanningOrderBy(filters.sortBy);
147 |

> 148 | const [plannings, totalRows] = await Promise.all([

        |                                    ^
    149 |       db
    150 |         .select()
    151 |         .from(planning)

}
2026-11-03T07:52:25.779Z ERROR [Better Auth]: INTERNAL_SERVER_ERROR Error: Failed query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id", "impersonated_by" from "sessions" where "sessions"."token" = $1
params: vlJAA4Io6MUQGwINPw0CSste5f1WyBWD
at async (src/server/guards/auth.guard.ts:12:21)
at async (src/server/decorators/with-error-handler.ts:11:14)
10 | return (async (...args: TArgs) => {
11 | const [req] = args;

> 12 | const session = await auth.api.getSession({ headers: req.headers });

     |                     ^

13 |
14 | if (!session?.user?.id) {
15 | throw new UnauthorizedException(); {
query: 'select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id", "impersonated_by" from "sessions" where "sessions"."token" = $1',
params: [ 'vlJAA4Io6MUQGwINPw0CSste5f1WyBWD' ],
[cause]: Error: read ETIMEDOUT
at async (src/server/guards/auth.guard.ts:12:21)
at async (src/server/decorators/with-error-handler.ts:11:14)
10 | return (async (...args: TArgs) => {
11 | const [req] = args;

> 12 | const session = await auth.api.getSession({ headers: req.headers });

       |                     ^
    13 |
    14 |     if (!session?.user?.id) {
    15 |       throw new UnauthorizedException(); {
    errno: -60,
    code: 'ETIMEDOUT',
    syscall: 'read'

}
}

convert goals steps into sub goals and make each goal have a single plan

add row level secutiry

add feature to organize resources with ai

add export course material as markdown or as single page

enable search in course or search in knowledge base

integrate with tool that auo summarize the videos from inside modawim

- handle archived itmes page to use tabs bar like tags page

- add feature to a chrome extension to auto detect facebook posts to auto save
- add feature to chrome extension to add to an existing resource

- add note excerpt and fetch a note on opening the note

- make the journal entry have array of imageUrls and a carousel
