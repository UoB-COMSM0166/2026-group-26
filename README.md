<h1 align="center">Group 26 Report</h1>

## Report Overview

1. [Network Access Guidelines](#network-access-guidelines)
2. [Introduction](#introduction)
3. [Requirements](#requirements)
4. [Design](#design)
5. [Implementation](#implementation)
6. [Evaluation](#evaluation)
7. [Process](#process)
8. [Sustainability](#sustainability)
9. [AI statement](#ai-statement)
10. [Conclusion](#conclusion)
11. [Your Group](#your-group)
12. [Contribution Statement](#contribution-statement)

## Network Access Guidelines

Please note that the system has now fully transitioned to domain-name access. Accessing the system directly via its IP address may no longer be successful. 

Additionally, due to the university's network security policies, access might be restricted on certain internal campus networks. If you encounter connectivity issues, it is recommended to switch to an alternative network environment, such as a mobile data hotspot, which has been verified to work reliably.

---
<div align="center">
  <a href="https://www.youtube.com/watch?v=j5TUHfbsKxg&t=25s">
    <img src="https://img.youtube.com/vi/j5TUHfbsKxg/maxresdefault.jpg" alt="Watch the video" width="700">
  </a>
  <p>Click the image to visit our YouTube channel :)</p>
</div>

## Introduction
---
Our game is a top-down vehicle survival game in which the player controls an evader and must stay alive until the timer ends. The game combines fast-paced driving, enemy avoidance, combat, and resource management within an interactive urban map. Players can enter buildings such as hospitals and weapon shops to restore health, buy weapons, and unlock new attack options. The game also includes easy, normal, and difficult modes to support different levels of challenge.

What makes our game novel is its combination of timed survival driving with meaningful map interaction. Buildings are not just background objects, but strategic spaces that shape player decisions. This turns the game from a simple evasion experience into a layered survival loop built around movement, upgrades, and risk-reward choice.

### *The game is based on*

Our game design is deeply influenced by the primal thrill of "Hunter vs. Hunted." We drew inspiration from several classic and modern titles to define our core mechanics:
- ***Pac-Man*** The foundational concept of navigating a confined space while avoiding enemies. It taught us the importance of map layout and power-ups in changing the tide of the game.
- ***Need for Speed*** This served as our main reference for the Vehicle aspect. We analyzed how high-speed chases create tension and how the "Police vs. Racer" dynamic offers two distinct but equally fun experiences.

<div align="center">
<table>
  <tr>
    <td align="center"><img src="https://github.com/user-attachments/assets/aedb526f-5106-47e6-8b1e-513bae0b25f1" alt="PacMan" width="360"></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/f83a3125-b9d4-4cc6-964a-c5fded8e8b82" alt="NFS" width="360"></td>
  </tr>
</table>
</div>

## Requirements
---
### ***Ideation and concept selection***

At the beginning of the project, our team explored four possible game directions: a text-based adventure, a simulation/construction game, a top-down stealth game, and a chase-and-evasion game. These ideas reflected different design priorities, ranging from narrative depth to strategy and fast-paced action. After discussion, we became most interested in the chase-and-evasion direction because it offered a clear core gameplay loop, immediate player feedback, and strong potential for tension and replayability.
<div align="center">
  <img src="https://github.com/user-attachments/assets/54fcde26-e1c3-443b-b8ef-9622ee8b4ec1" width="550">
  <p><b>Voting</b></p>
</div>

Our early goal was to create a game that was easy to understand at a basic level but still allowed for strategic decision-making during play. Compared with the other three ideas, the chase-and-evasion concept seemed the most suitable for this because it combined simple controls with opportunities for map design, item systems, and escalating challenge. It also matched the team's interest in building a game centred on movement, pressure, and survival rather than narrative or construction mechanics.

### ***Paper prototyping and early design decisions***

We then developed two paper prototype ideas. The first was a top-down vehicle survival game focused on evasion, movement control, and power-ups. The second was a multiplayer ricochet space shooter based on bouncing projectiles and shrinking play areas. Although both ideas were promising, the vehicle survival prototype was chosen as the stronger foundation for further development.

<div align="center">
<table>
  <tr>
    <th>The version ultimately adopted</th>
    <th>One of the dismissed case</th>
  </tr>
  <tr>
    <td align="center">
      <a href="./video/IMG_3466.mov"><img src="https://github.com/user-attachments/assets/4e81a92a-ebd1-44c2-ab46-44a279080995" alt="Idea 1" width="360"></a><br><br>
      <a href="./video/IMG_3466.mov">🎬 Play Video</a>
    </td>
    <td align="center">
      <a href="./video/IMG_3470.mov"><img src="https://github.com/user-attachments/assets/63be1e5e-0680-43a0-9856-fb50a0960278" alt="Idea 2" width="360"></a><br><br>
      <a href="./video/IMG_3470.mov">🎬 Play Video</a>
    </td>
  </tr>
</table>
</div>

The main reason for this decision was that the vehicle prototype produced a clearer and more focused gameplay loop. It created tension through survival over time, gave the player a strong sense of movement and risk, and allowed more room for environmental interaction. By contrast, the ricochet shooter idea would have required more complex balancing between multiple players, projectile behaviour, and arena control. As a result, we decided to focus on the vehicle survival concept and refine it into a single-player game in which the player controls an evader and attempts to survive until the timer ends.

During this stage, we also made an important scope decision. Earlier ideas included a playable chaser role, but we later narrowed the project to a single playable evader role. This allowed us to concentrate development effort on polishing the survival loop, improving map interaction, and implementing progression systems such as weapon unlocking and recovery options.

<div align="center">
  <img src="https://github.com/user-attachments/assets/11840186-9279-4097-a8e0-ffa6bf8541ac" width="550">
  <p><b>Figure: Early stage diagram design</b></p>
</div>

### List of Stakeholders

- The primary stakeholder group is **players**, who require a game that is understandable, responsive, fair, and engaging over repeated play sessions. Their needs directly shaped decisions such as adding difficulty settings, improving interaction clarity, and introducing meaningful choices through buildings and upgrades.

- A second stakeholder group is the **development team**, who needed requirements that were feasible within the time and technical constraints of the module. This influenced our decision to reduce scope, prioritise a single polished gameplay loop, and focus on features that could be realistically implemented and tested.

<div align="center">
  <img src="https://github.com/user-attachments/assets/bad555d6-5995-4a3e-8695-bc7cae06c051" width="550">
  <p><b>Figure: Stakeholder</b></p>
</div>

### Core functional requirements

**From the ideation and prototyping stages, we identified the following core functional requirements:**

- The player must be able to control a vehicle in a top-down environment.
- The game must include a survival-based win condition linked to a countdown timer.
- The player must be able to take damage and lose the game if health reaches zero.
- The map must contain interactive buildings, including a hospital and a weapon shop.
- The hospital must allow the player to restore health.
- The weapon shop must allow the player to purchase or unlock new attack options.
- The game must provide multiple difficulty levels: easy, normal, and difficult.

### User stories

- As a player, I want to control the vehicle smoothly, so that movement feels responsive and survival depends on skill.
- As a player, I want a clear survival timer and health display, so that I can understand my current progress and risk.
- As a player, I want to enter buildings such as hospitals and weapon shops, so that exploration becomes strategically useful.
- As a player, I want to unlock or obtain stronger weapons, so that I gain more options for dealing with threats.
- As a player, I want to choose between easy, normal, and difficult modes, so that the challenge matches my skill level.
- As a player, I want clear on-screen instructions, so that I can learn the game quickly.
- As a player, I want feedback when interacting with buildings, so that I understand available actions.

### Acceptance criteria

These user stories were translated into practical acceptance criteria during development. For example, the vehicle controls needed to be stable and learnable, buildings needed to trigger an interaction menu when entered, and the game needed to end consistently in either victory (timer completed) or defeat (health depleted). Similarly, difficulty modes needed to produce observable differences in challenge rather than acting as cosmetic labels only.

Overall, the requirements process helped us move from a broad concept to a more realistic and implementable game. It also helped us identify where reducing scope improved quality, particularly in the decision to focus on one playable role and a stronger core survival experience.

## Design
---
### 1. System Architecture
 
The system uses a layered architecture that separates real-time gameplay from transactional services. At the outer layer, the player interacts with a browser-based `p5.js` client, which is responsible for rendering and input capture. Under this, a front-end controller coordinates the running game as a lightweight application layer rather than part of the domain model. It manages the game loop, camera, map generation, and global state machine, so the presentation side stays responsive while gameplay progression remains clearly controlled.
 
In deployment, a reverse proxy acts as the public entry point, serves static game assets, and forwards protected requests to the backend API. Behind it, an Express service manages account operations, shop behaviour, and progress persistence, while a local SQLite database stores durable user and progression data. This arrangement matches the workload of the system: frame-by-frame gameplay logic runs on the client, while authentication, equipment ownership, currency deduction, and persistent progress are handled through authoritative server-side validation. In practice, this keeps the game responsive without weakening consistency in identity and progression.
 
### 2. Class Design
 
The class design follows the same division of responsibility as the architecture. On the gameplay side, the front-end controller is the main coordinating object, and it organises the simulation through a wide set of states rather than treating the game as a single play screen. Menu, authentication, difficulty selection, active play, pause, help, tutorial overlays, shop interaction, defeat, victory, and special-weapon targeting are all represented explicitly. These states decide what should be updated, what should be rendered, and whether survival time should continue to advance. During active play, the controller updates entities, spawns enemies and drops, and keeps the camera centred on the player. In pause, tutorial, shop, and targeting states, the simulation is partly or fully suspended while the presentation layer remains active.
 
The relationships between gameplay and UI classes are organised around this controller-led structure. The controller manages transitions from menu login to difficulty choice, from building interaction to the shop interface, and from special-weapon activation to map-selection or remote-guidance modes. This keeps the world simulation separate from the surrounding interface. At the object level, `Vehicle` acts as the common superclass for `Player` and `Enemy`, while `Projectile`, `PowerUp`, and `Building` model associated world entities, and `AuthUI`, `ShopUI`, and `TutorialSystem` support interface, persistence, and guided interaction rather than core movement behaviour.
 
### Class Diagram

<div align="center">

<img src="https://github.com/user-attachments/assets/4a0b90a7-6f39-4209-8e22-0cabbccd43d1" alt="Class Diagram" width="550">

<p><b>Figure: Class Diagram</b></p>

</div>

### 3. Behavioural Design

The behavioural design uses a controlled interaction flow to connect account-related operations, gameplay progression, and interface transitions. The system begins outside active survival play, moving through menu login and authentication before reaching difficulty selection. The player then enters the main play state, where the controller manages continuous entity updates, enemy and drop spawning, camera centring, and survival timing. Behaviour changes when the player moves into other states. If a building interaction opens the shop interface, the system leaves active survival progression so transactional operations can take place in a dedicated context. In the same way, when the player opens tutorial, help, pause, or targeting interfaces, the simulation is partly or fully suspended while the surrounding presentation is preserved.

A representative interaction sequence is the login flow, in which the player submits credentials, the backend validates the account, returns a signed token, and then serves persistent progress through a protected request before gameplay begins. This behaviour also matches the distinction between client responsiveness and server authority in the wider system design. Authentication, equipment ownership, currency deduction, and progress persistence are not treated as purely local events, but as backend-validated operations handled through the service layer. Shop interaction therefore links the live play session with persistent account state, while progress loading and saving maintain continuity across sessions through durable storage. State transitions ensure that transactional actions happen in explicit contexts instead of being mixed directly into frame-by-frame play logic. Observed gameplay followed this design closely: the menu flow, tutorial gating, pause behaviour, special-weapon targeting, and win and lose screens all matched the intended state-based model.

### Sequence Diagram

<div align="center">

<img src="https://github.com/user-attachments/assets/0828154c-7509-474b-97ab-c98003b5339e" alt="Sequence Diagram" width="700">

<p><b>Figure: Sequence Diagram</b></p>

</div>

 
### 4. Design Summary
 
The design combines a layered architecture with explicit behavioural control to support responsive gameplay and reliable progression management. Client rendering, controller coordination, backend services, reverse-proxy access, and persistent storage each have a distinct role, which makes the structure easier to maintain. At the same time, the state-based gameplay model keeps authentication, shop interaction, targeting, pause, overlays, and end conditions in clearly defined contexts. This gives the implemented gameplay experience a clear and manageable structure.

## Implementation
---

The core of our game was implemented using a split client-server architecture. The front-end, built with p5.js, is responsible for the main game loop, canvas rendering, player input, and moment-to-moment gameplay simulation. The back-end, built with Node.js, Express, and SQLite, handles user authentication through JWT-based token verification, persistent player progress, and server-side shop data. Development progressed iteratively, beginning with vehicle movement and map interaction, then expanding into enemy AI and combat systems, and finally integrating the backend-supported account, shop, and progression features. Communication between the client and server is performed through asynchronous REST API requests so that gameplay rendering remains responsive while data is loaded or saved.
<div align="center">
  <img src="https://github.com/user-attachments/assets/03883ea1-f5e1-4a54-ac6f-fa4613b615a0" width="700">
</div>

### ***Technical Challenge 1: Vehicle Physics, Collision Handling, and Weapon Systems***
Implementing responsive yet weighty vehicle movement was one of our main technical challenges. We developed custom movement logic around acceleration, steering response, friction, and directional momentum so that vehicles felt controllable without becoming either too slippery or too rigid. To strengthen the drifting feedback visually, we implemented fading skid marks and smoke particle effects behind the car.

Collision handling was tightly connected to movement. We needed to support interactions between the player, enemies, map boundaries, buildings, and solid obstacles. This was addressed through a combination of map-boundary checks, rectangular building bounds, circular vehicle collision checks, collision resolution, wall-sliding behaviour, and enemy separation logic. These changes prevented vehicles from clipping into structures and reduced the visual stacking of enemies during pursuit.

Combat introduced additional complexity. Different weapons required different projectile speeds, lifetimes, collision responses, and visual effects. To support this, we built a modular Projectile system that handles multiple weapon behaviours, including standard bullets, spread shots, burst fire, continuous laser beams, and area-of-effect fire attacks. We also added explicit cleanup and termination logic for temporary projectile and missile states so that special weapon effects do not persist incorrectly or lock the player into unintended control states.

### ***Technical Challenge 2: Asset Loading, Front-End State Control, and Game Balancing***
Because the game depends on a large number of visual assets, first-time loading could otherwise result in visible delays or incomplete rendering. To address this, we implemented a custom asset preloading pipeline together with a boot-loading screen that checks asset readiness before entering the main menu. This ensured that core visual resources were available before normal gameplay began.

Another major challenge was front-end state control. Early in development, gameplay logic could continue running while certain overlays were open, which created unfair situations for the player. We resolved this by using explicit game states to separate menu, play, pause, tutorial, targeting, and shop behaviour. This allowed us to pause gameplay updates when needed while still rendering the correct background scene and interface.

Finally, balancing enemy pressure and player rewards required repeated tuning. We adjusted enemy spawn timing according to difficulty settings and used weighted random spawning for power-ups and special items. This helped the game remain challenging while keeping the overall pacing readable and fair across repeated play sessions.

## Evaluation
---
### **Heuristic Evaluation** (week7)
| **Interface** | **Issue** | **Heuristics** | **Frequency 0 (rare) to 4 (common)** | **Impact 0 (easy) to difficult (4)** | **Persistence (once) to 4 (repeated)** | **Severity** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Game play interface** | Vehicle color contrast could be more noticeable, and drift trajectory highlighted | Visibility of system status | 2 | 1 | 3 | 2 |
| **Game running interface - Map boundary / Collision system** | Lack of obvious pause and restart buttons ingame. Players easily hit walls suddenly due to limited vision, lacking advance warnings. | User control and freedom | 2 | 3 | 3 | 3 |
| **Game running interface - Map boundary / Collision system** | " | Error prevention | 2 | 3 | 2 | 2 |
| **Game interaction** | The initial version lacks prompts for interaction, which may increase the user's memory load | Recognition rather than recall | 2 | 2 | 1 | 2 |
| **Difficulty system** | The initial version lacks difficulty options, unable to accommodate players of different skill levels. | Flexibility and efficiency of use | 4 | 3 | 3 | 4 |
| **Game interface design** | The aesthetics of the game interface design could be improved | Aesthetic and minimalist design | 1 | 2 | 2 | 4 |

---
### Findings of User's Evaluation

- **Visual Feedback & System Status (Visibility of system status / Aesthetic design):** The color contrast of the vehicles is too weak, and the drifting trajectory needs to be highlighted. Additionally, crucial power-ups lack visibility. The overall interface aesthetics could also be improved.

- **User Control & Error Prevention:** The main gameplay interface lacks obvious pause and restart buttons. Due to restricted vision, players often suddenly crash into walls, highlighting a severe lack of advanced map boundary cues.

- **Cognitive Load & Onboarding:** The initial version lacks clear interaction prompts, increasing the user's memory load. Explicit movement instructions should be placed at the top of the interface. Furthermore, there is no transition prompt indicating "press to start" before gameplay begins.

- **Gameplay Clarity:** The core mechanics are poorly communicated; players need to know win conditions and whether they should dodge or collide with NPCs.

- **System Flexibility:** The game currently lacks a difficulty selection system, failing to accommodate players of different skill levels.
---

### Qualitative Evaluation

- **Misalignment in Core Objective Communication:** 
Despite the asymmetric "Chase & Evasion" design, the UI fails to convey these rules. Players experience a steep learning curve due to confusion over victory conditions and NPC interaction logic. Mandatory movement and objective prompts must be integrated directly into the HUD.

- **Visual Hierarchy and Player Frustration:** 
Essential interactive elements like player vehicles and shields blend into the background due to low contrast. Combined with the lack of collision warnings at map boundaries, this results in "cheap" deaths (e.g., sudden wall crashes) that punish players for UI shortcomings.

- **Lack of Dynamic Progression and Replayability:** 
The current loop is too shallow. To enhance strategic depth, the game requires a level progression system featuring randomized building styles and positions upon completing a stage. Combat variety must be expanded with new weapon types. Crucially, the implementation of at least two difficulty tiers—achieved by altering game speed, enemy toughness, or power-up availability—is necessary to sustain long-term engagement for all players.

### Quantitative Evaluation (week8)
|                     | User 1  | User 2  | User 3  | User 4  | User 5  | User 6 | User 7  | Average  |
| ------------------- | ------- | ------- | ------- | ------- | ------- | ------ | ------- | -------- |
| easy SUS score      | 55      | 50      | 62.5    | 95      | 55      | 50     | 52.5    | 60       |
| hard SUS score      | 52.5    | 50      | 62.5    | 92.5    | 52.5    | 50     | 57.5    | 59.64286 |
| easy NASA TLX score | 36.6666 | 41.6666 | 36.6666 | 21.6666 | 69.1666 | 25     | 43.3333 | 39.16661 |
| hard NASA TLX score | 42.5    | 43.3333 | 45.8333 | 31.6666 | 86.6666 | 25     | 42.5    | 45.35711 |

**The first Wilcoxon Signed-Rank Test** is as follows:

Null hypothesis: The easy SUS score and the hard SUS score share the same distribution.

Alternate hypothesis: The easy SUS score and the hard SUS score do not share the same distribution.

Result: W test statistic=4 (number of non-tied pairs=5).
So the null hypothesis was not rejected at a 90% confidence interval. This meant the test result is **not statistically significant.**

**The second Wilcoxon Signed-Rank Test** is as follows:

Null hypothesis: The easy NASA TLX score and the hard NASA TLX score share the same distribution.

Alternate hypothesis: The easy NASA TLX score and the hard NASA TLX score do not share the same distribution.

Result: W test statistic=1 (number of non-tied pairs=6).
So the null hypothesis was not rejected at a 95% confidence interval. This meant the test result is **not statistically significant.**

### Findings of Quantitative Evaluation

The low average SUS score and NASA TLX score demonstrate the **necesscity for us to improve overall user experience in all aspects.** While the NASA TLX score for hard being higher than easy difficulty shows that there is a clear learning effect within the data, and that the suggestion to add a tutorial to the game (by one test user) is an excellent way to enhance user experience. On the other hand, both Wilcoxon Signed-Rank Tests shows no statistically significant differences, meaning that the easy difficulty and the hard difficulty are too similar, **so the 3 difficulties should be readjusted.**

### Technical challenges

1. Unintended bugs caused by the interaction of the timer and shop mechanics

2. Missile flying out of the map indefinitely (which locks player control) bug.

## Process
---
### *Overall Approach*
Our team followed an iterative and highly collaborative development process throughout the project. In the early stages, our priority was not to impose a rigid structure immediately, but to build a shared understanding of what kind of game we wanted to make and what could realistically be delivered within the time available. We began by discussing several possible ideas and comparing them in terms of gameplay potential, technical feasibility, and scope. As the project became more clearly defined, we converged on a top-down vehicle survival game focused on movement, evasion, combat, and map interaction. We also made an important scoping decision during this stage: rather than trying to pursue every early feature idea, we chose to prioritise a smaller set of mechanics that could be implemented to a higher standard. 

### *Communication and Shared Documentation*
Our main communication platform was WeChat, which we used for everyday discussion, arranging meetings, reporting progress, and raising issues as soon as they appeared. Alongside this, we kept a shared Google Doc that functioned as a common space for recording ideas, bugs, usability concerns, and development notes. This was particularly useful because it meant that when someone noticed a problem during coding or playtesting, it did not have to wait until the next meeting to be remembered. Instead, it could be written down immediately and then revisited as a team. In practice, this gave our process a good balance between fast informal communication and a persistent written record of what still needed attention. 

### *Meetings and Task Coordination*
Our meetings were organised around the actual pace of development rather than following a fixed timetable. In general, we met once every one to two weeks, depending on how smoothly development was progressing and whether there were enough open issues to justify a longer discussion. Meeting times were arranged in the WeChat group based on when everyone was available. These meetings were used to review what had already been completed, identify short-term priorities, and decide what should be tackled next. This rhythm worked well because it gave the team regular checkpoints without creating unnecessary formal overhead. It also reduced the risk that members would become too isolated in their own tasks, which was especially important in a project like ours where gameplay, balancing, interface design, and technical implementation all influenced one another.

### *Roles and Collaborative Development*
Although our process remained group-centred throughout, some roles became clearer over time. One member took primary responsibility for overall task coordination and GitHub/report management, another contributed substantially to report writing, one member focused mainly on core implementation, and other members contributed through testing, review, feedback, and sections of the written report. However, we did not treat the project as a set of fully separate individual components. Instead, we worked with a flexible structure in which responsibilities could shift when necessary. This was helpful in the early stages, because it allowed the team to adapt quickly while the game concept was still evolving. At the same time, it also showed us one of the limitations of a highly flexible process: when responsibilities are not fully defined from the beginning, some areas can come to depend more heavily on particular members. Looking back, we think this flexible approach suited ideation and early development well, but slightly clearer ownership of major systems would have improved efficiency later in the project.

For version control, we used GitHub with a branch-based workflow. Each member worked on their own branch and merged into the main branch only after the relevant work had been checked. In practice, when someone finished a task, they would usually notify the group in WeChat so that other members could take a quick look before the responsible person merged the changes. This was not a fully formal code review process, but it provided a useful level of visibility and reduced the risk of unstable or conflicting changes being introduced into the shared codebase. It also allowed multiple people to work in parallel without constantly interfering with one another’s progress. Combined with Google Docs for collaborative writing, this meant that code development, testing, and report writing could all move forward together rather than becoming bottlenecked at the end.

<div align="center">
<table>
  <tr>
    <th><a href="https://samuel88913-1776174836623.atlassian.net/jira/software/projects/KAN/boards/1">Our Kanban Link</a></th>
    <th><a href="https://docs.google.com/document/d/13TsGkyWaULcPZaSbJa6dbB54RRgPPovsB3XJL-yhKzo/edit?usp=sharing">Our Google Docs Link</a></th>
  </tr>
  <tr>
    <td align="center"><img src="https://github.com/user-attachments/assets/322eec62-c860-48b4-9749-c60d5e11a4f4" alt="image" width="360"></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/e697b4dc-a1bf-4750-b147-530134cc8113" alt="image" width="360"></td>
  </tr>
</table>
</div>

### *Problem Solving, Evaluation, and Reflection*
A major strength of our process was the way we handled emerging problems. Many of the most difficult issues were not isolated bugs inside a single feature, but integration problems created by the interaction of several systems. For example, feedback and testing highlighted problems such as the timer continuing while the player was inside the shop, missiles flying indefinitely when leaving the map, police cars stacking together, unclear controls, unclear win conditions, and insufficient distinction between difficulty levels. More generally, we also had to make repeated adjustments to collision logic, movement behaviour, weapon balance, and the visibility of interactive elements. Because these issues affected both technical stability and user experience, they could not be solved well through isolated work alone. Our usual approach was to record the problem immediately, discuss it in the group, decide whether it was a priority for the next round of development, and then test the revised behaviour again after changes were made. This made our problem-solving process relatively efficient and helped us respond quickly when the game did not behave as intended or when players found mechanics confusing.

Another valuable aspect of our process was that evaluation genuinely fed back into development. User review and testing did not function as a final-stage formality, but as an input to further refinement. Feedback pointed to several recurring issues, including weak visual contrast, missing interaction prompts, unclear objectives, and difficulty settings that did not feel sufficiently different. These findings made it clear that implementing a mechanic was not enough on its own; the mechanic also had to be understandable, visible, and meaningful to players. As a result, our process became increasingly user-centred over time. We paid more attention not only to whether the game technically worked, but also to whether players could understand how to play it and why particular design choices mattered.

Overall, our development process was practical, communicative, and adaptable. We did not rely on complex formal management methods, but on frequent communication, shared visibility of issues, and a willingness to adjust our plans when necessary. This worked particularly well for a project where gameplay ideas, technical implementation, and evaluation results were all evolving at the same time. At the same time, the project also showed us that flexibility alone is not always enough. If we were to repeat the project, we would keep the same strengths of open communication, shared documentation, and branch-based collaboration, but we would define ownership of major systems earlier and plan integration testing more explicitly. The main lesson from our process is that effective teamwork in software development depends not just on dividing work, but on maintaining clear communication, recording issues systematically, and adapting quickly when design or technical challenges emerge.

## Sustainability
---

On the social dimension, we have taken steps to improve the trust of users towards our game. Previously (before week 14), accessing our game through a browser would show the website being marked as unsafe due to the lack of an SSL certificate, as well as using HTTP instead of HTTPS (encrypted HTTP). So, we have applied for an SSL certificate, and also changed our website to use HTTPS. This allows our game website to be marked as safe by modern browsers, which would make users feel more secure when sending information (especially email address and password for account registration/ login) to our game website.

On the environmental dimension, our game webpage is already somewhat energy efficient. We have done a simple test of checking our games’ CPU usage through the Performance Monitor in Developer Tools of Google Chrome using one of our group members’ laptop. During the test, the CPU usage of the game’s main page fluctuated from 8 to 8.7%; the usage in game (easy difficulty) fluctuated from 20 to 30%; the usage in game (normal difficulty) fluctuated from 20 to 35%; while the defeat screen’s usage was around 18%. In contrast, we checked the CPU usage of some popular websites (which also feature many media outputs) using the same laptop and browser for comparison. When accessing YouTube, the CPU usage fluctuated greatly between 1 to 100%, depending on what was being loaded at the moment. Similarly, the CPU usage of accessing the BBC news website fluctuated greatly between 3 to 100%, also depending on what was being loaded at the moment. Therefore, it seems that on average, the CPU usage of our game website is not higher than that of common webpages featuring media outputs. We believe that this was partly caused by our game design matching one of the advices of Green Software Patterns, which is to use the MP4 format instead of the GIF format for animated content.

On the individual dimension, our game has a mixed effect on users’ mental health. This is because as a chase-and-evasion game, our game does have a significant learning curve (even if it is not too steep). So, it was easy for players to feel challenged or even simply lose games when they first tried out the game. However, this learning curve, when coupled with the significant learning effect (as mentioned in Quantitative Evaluation), can have its positive side: Since players who have spent a certain time playing the game can clearly feel their improvement in gameplay skills in this game, this would make them feel better over time, especially those who initially felt challenged by the game. As a result of this mixed effect on mental health, we recommend that all users start trying this game on easy difficulty at first.

On the security and privacy dimension, we have implemented a comprehensive set of measures to protect user data and system integrity. To ensure secure authentication and authorization, user passwords are safely hashed rather than stored in plaintext, and session management relies on a robust JWT-based mechanism. Backend API endpoints, such as those for player progression and shop purchases, enforce strict server-side validation. We have also improved account security by mandating email verification for new registrations and utilizing time-limited, single-use tokens for password resets. Furthermore, all database operations use parameterized queries to effectively mitigate SQL injection risks, and sensitive configurations (e.g., JWT secrets and email credentials) are properly isolated in environment variables. At the deployment level, we adhere to the principle of least exposure by restricting unnecessary network ports and strictly controlling remote access (such as blocking SSH port 22) to minimize the risk of malicious scanning and unauthorized connections.

## AI statement
---
Our team used AI as a supporting tool in a limited and targeted way during this project. Its main use was in the preparation and refinement of visual assets for the game interface and environment, including icons, animated visual elements, weapon models, and parts of the map. Our usual workflow was to first search online for reference materials or source assets that we felt were suitable, and then use AI-assisted tools to adjust aspects such as orientation, viewing angle, placement, and overall visual style so that the materials better matched the look and feel of our game. This was particularly helpful because our team does not have specialist UI or visual design experience, so AI provided practical support in improving consistency and presentation.

AI was also used occasionally during development to help identify the possible causes of errors and support debugging. In these cases, it was used to suggest likely sources of problems or provide possible directions for troubleshooting, rather than to replace our own testing and implementation work.

Importantly, all AI-assisted outputs were reviewed, selected, and integrated manually by the team. Final decisions about which assets to use, how they should appear in the game, and how technical issues should be resolved were made by us. AI was therefore used as an assistive tool to support visual refinement and debugging, while the overall design, implementation, testing, and report writing remained the team’s own work.

### Sample AI Assets

|  |  |  |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/4dd5a0fa-698f-4a2d-bd1d-1fc963927119" width="180"> | <img src="https://github.com/user-attachments/assets/1b80e0a7-39f7-4487-8766-5c9045b6ace2" width="180"> | <img src="https://github.com/user-attachments/assets/4b770f9a-bab4-4a26-a794-3a25e3992f16" width="180"> |
| <img src="https://github.com/user-attachments/assets/95348988-5c3c-4732-9eb1-b20a748a5dc0" width="180"> | <img src="https://github.com/user-attachments/assets/3b930309-6309-40ce-81af-74888e6974c1" width="180"> | <img src="https://github.com/user-attachments/assets/a568b880-f1bd-4460-8f0a-073e4a6f0e3e" width="180"> |
| <img src="https://github.com/user-attachments/assets/f3f7c0c5-a9b7-4196-a34d-b2793d2fe8d9" width="180"> | <img src="https://github.com/user-attachments/assets/8d1e3d7c-5237-452b-8e78-319095294052" width="180"> | <img src="https://github.com/user-attachments/assets/f7270953-c3f6-4ec9-aaa9-6c51176cce14" width="180"> |
| <img src="https://github.com/user-attachments/assets/92d85539-3005-453c-b58a-b415abb7f72f" width="180"> | <img src="https://github.com/user-attachments/assets/efd22639-da4e-4a4a-a022-3252e26ef59b" width="180"> | <img src="https://github.com/user-attachments/assets/37aea2a5-4f84-41ac-97c9-06d635444f42" width="180"> |

## Conclusion
---
***Project Reflection & Lessons Learnt:***

This project took us from a broad chase-and-evasion idea to a playable top-down vehicle survival game with driving, combat, interactive buildings, difficulty modes, and persistent progression. Looking back, the most important outcome was succeeding in turning an initially broad concept into a focused, coherent gameplay loop. Early in the project, we made a critical scoping decision to concentrate on a single playable evader role rather than attempting multiple roles or complex multiplayer interactions. In retrospect, this disciplined scope control was one of our most valuable choices, allowing us to invest more effort into core mechanics: movement, survival pressure, map interaction, and progression. 

However, our evaluation taught us that implementing mechanics is not enough on its own; a system may function technically while still being unclear or frustrating to the user. Qualitative feedback highlighted issues with onboarding, weak visual hierarchy, and insufficient cues for map boundaries. Quantitative results also suggested that the differences between difficulty levels were not consistently perceived. These findings reinforced a key lesson: in game development, success depends not only on whether a feature works, but on whether players can immediately understand and use it meaningfully. 

***Teamwork & Challenges:***

We learned several practical lessons about collaborative software development. First, integration issues often pose greater challenges than isolated feature bugs, as evidenced by cross-system conflicts like the timer continuing during shop interactions and out-of-bound projectiles locking player controls. While our communication was frequent and evaluation loops were active, a highly flexible team structure showed its limits. It sometimes led to unclear ownership of major systems and delayed the discovery of cross-system issues. While adaptability was beneficial during ideation, establishing clearer responsibility assignment and enforcing explicit integration testing earlier in development would have significantly improved efficiency and mitigated later systemic problems.

***Future Work: Immediate Next Steps***

The immediate next steps for the current game focus on clarity and balance. We plan to improve onboarding by adding stronger HUD prompts, clearer win-condition communication, and explicit interaction instructions. Furthermore, we will rebalance the difficulty settings to ensure each mode delivers a distinct experience. Visual feedback will be refined through stronger contrast, prominent power-up visibility, and earlier warnings near map boundaries. In parallel, we will polish combat balance to ensure the survival loop feels fair and satisfying over repeated play sessions.

***Future Work: Sequel Development***

If we had the opportunity to develop a sequel, we would expand the project toward a deeper structural design. The most promising direction involves an advanced progression system featuring multiple stages or districts, greater map variety, expanded enemy and weapon types, and richer long-term strategic choices. We would also consider revisiting ideas that were cut during early scoping, such as broader asymmetric role designs (e.g., a playable chaser), but only after ensuring the core experience remains consistently clear and balanced.

## Your Group
GROUP PHOTO.

<div align="center">
  <img src="https://github.com/user-attachments/assets/ac7c8d00-a52d-4c9e-89f2-0bc5ce44d51c" alt="image" width="700">
</div>

- Meb1：Li Ka Fai; Email: gavins092590@gmail.com; Role：Game Designer

- Meb2：Yanqing Peng; Email：ai25403@bristol.ac.uk; Role：Project Manager

- Meb3：Ping Yu Sung; Email：yo25075@bristol.ac.uk; Role：UX Researcher

- Meb4：Fan Lin; Email：zs25891@bristol.ac.uk; Role：Coder

- Meb5：FuQiuting; Email：rm25551@bristol.ac.uk; Role：Tester

- Meb6：Jizhe Jin; Email：hy25163@bristol.ac.uk;  Role：Visual Designer

## Contribution Statement
| Team Member | Role | Contribution Share | Key Contributions |
| :--- | :--- | :--- | :--- |
| Li Ka Fai | Game Designer | 16.67% | Designed the core chase-and-evasion survival loop, vehicle physics, collision handling, and modular weapon systems. |
| Yanqing Peng | Project Manager | 16.67% | Coordinated task allocation, managed the GitHub branch workflow, organized team meetings, and oversaw documentation/report writing. |
| Ping Yu Sung | UX Researcher | 16.67% | Conducted heuristic and quantitative evaluations (SUS, NASA TLX), and formulated UX feedback for UI/onboarding improvements. |
| Fan Lin | Coder | 16.67% | Implemented the p5.js front-end gameplay loop, state controllers, and the Node.js/Express/SQLite back-end with JWT authentication. |
| Fu Qiuting | Tester | 16.67% | Executed integration testing, tracked cross-system bugs (e.g., timer/shop interactions, out-of-bound missiles), and balanced difficulty. |
| Jizhe Jin | Visual Designer | 16.67% | Prepared and refined visual assets (including AI-assisted components), managed the boot-loading screen, and improved UI visual hierarchy. |
