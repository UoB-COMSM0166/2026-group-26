Play the game here: https://uob-comsm0166.github.io/2026-group-26/

# 2026-group-26
2026 COMSM0166 group 26

# COMSM0166 Project Template
A project template for the Software Engineering Discipline and Practice module (COMSM0166).

## Info

This is the template for your group project repo/report. We'll be setting up your repo and assigning you to it after the group forming activity. You can delete this info section, but please keep the rest of the repo structure intact.

You will be developing your game using [P5.js](https://p5js.org) a javascript library that provides you will all the tools you need to make your game. However, we won't be teaching you javascript, this is a chance for you and your team to learn a (friendly) new language and framework quickly, something you will almost certainly have to do with your summer project and in future. There is a lot of documentation online, you can start with:

- [P5.js tutorials](https://p5js.org/tutorials/) 
- [Coding Train P5.js](https://thecodingtrain.com/tracks/code-programming-with-p5-js) course - go here for enthusiastic video tutorials from Dan Shiffman (recommended!)

---
## Introduction

Our game is a top-down vehicle survival game in which the player controls an evader and must stay alive until the timer ends. The game combines fast-paced driving, enemy avoidance, combat, and resource management within an interactive urban map. Players can enter buildings such as hospitals and weapon shops to restore health, buy weapons, and unlock new attack options. The game also includes easy, normal, and difficult modes to support different levels of challenge.

What makes our game novel is its combination of timed survival driving with meaningful map interaction. Buildings are not just background objects, but strategic spaces that shape player decisions. This turns the game from a simple evasion experience into a layered survival loop built around movement, upgrades, and risk-reward choice.

### *The game is based on.*

Our game design is deeply influenced by the primal thrill of "Hunter vs. Hunted." We drew inspiration from several classic and modern titles to define our core mechanics:
- Pac-Man: The foundational concept of navigating a confined space while avoiding enemies. It taught us the importance of map layout and power-ups in changing the tide of the game.
- Need for Speed: This served as our main reference for the Vehicle aspect. We analyzed how high-speed chases create tension and how the "Police vs. Racer" dynamic offers two distinct but equally fun experiences.


## Requirements

### Ideation and concept selection

At the beginning of the project, our team explored four possible game directions: a text-based adventure, a simulation/construction game, a top-down stealth game, and a chase-and-evasion game. These ideas reflected different design priorities, ranging from narrative depth to strategy and fast-paced action. After discussion, we became most interested in the chase-and-evasion direction because it offered a clear core gameplay loop, immediate player feedback, and strong potential for tension and replayability.
<img width="1419" height="752" alt="IMG_3753" src="https://github.com/user-attachments/assets/54fcde26-e1c3-443b-b8ef-9622ee8b4ec1" />


Our early goal was to create a game that was easy to understand at a basic level but still allowed for strategic decision-making during play. Compared with the other three ideas, the chase-and-evasion concept seemed the most suitable for this because it combined simple controls with opportunities for map design, item systems, and escalating challenge. It also matched the team's interest in building a game centred on movement, pressure, and survival rather than narrative or construction mechanics.




### Paper prototyping and early design decisions

We then developed two paper prototype ideas. The first was a top-down vehicle survival game focused on evasion, movement control, and power-ups. The second was a multiplayer ricochet space shooter based on bouncing projectiles and shrinking play areas. Although both ideas were promising, the vehicle survival prototype was chosen as the stronger foundation for further development.

| **The version ultimately adopted** | **One of the dismissed case** |
|:---:|:---:|
| [![Idea 1](https://github.com/user-attachments/assets/4e81a92a-ebd1-44c2-ab46-44a279080995)](./video/IMG_3466.mov)<br><br>[🎬 Play Video](./video/IMG_3466.mov) | [![Idea 2](https://github.com/user-attachments/assets/63be1e5e-0680-43a0-9856-fb50a0960278)](./video/IMG_3470.mov)<br><br>[🎬 Play Video](./video/IMG_3470.mov) |

The main reason for this decision was that the vehicle prototype produced a clearer and more focused gameplay loop. It created tension through survival over time, gave the player a strong sense of movement and risk, and allowed more room for environmental interaction. By contrast, the ricochet shooter idea would have required more complex balancing between multiple players, projectile behaviour, and arena control. As a result, we decided to focus on the vehicle survival concept and refine it into a single-player game in which the player controls an evader and attempts to survive until the timer ends.

During this stage, we also made an important scope decision. Earlier ideas included a playable chaser role, but we later narrowed the project to a single playable evader role. This allowed us to concentrate development effort on polishing the survival loop, improving map interaction, and implementing progression systems such as weapon unlocking and recovery options.

### List of Stakeholders

- The primary stakeholder group is **players**, who require a game that is understandable, responsive, fair, and engaging over repeated play sessions. Their needs directly shaped decisions such as adding difficulty settings, improving interaction clarity, and introducing meaningful choices through buildings and upgrades.

- A second stakeholder group is the **development team**, who needed requirements that were feasible within the time and technical constraints of the module. This influenced our decision to reduce scope, prioritise a single polished gameplay loop, and focus on features that could be realistically implemented and tested.

<img width="936" height="889" alt="Onion" src="https://github.com/user-attachments/assets/bad555d6-5995-4a3e-8695-bc7cae06c051" />

### Core functional requirements

From the ideation and prototyping stages, we identified the following core functional requirements:

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

### Acceptance criteria

These user stories were translated into practical acceptance criteria during development. For example, the vehicle controls needed to be stable and learnable, buildings needed to trigger an interaction menu when entered, and the game needed to end consistently in either victory (timer completed) or defeat (health depleted). Similarly, difficulty modes needed to produce observable differences in challenge rather than acting as cosmetic labels only.

Overall, the requirements process helped us move from a broad concept to a more realistic and implementable game. It also helped us identify where reducing scope improved quality, particularly in the decision to focus on one playable role and a stronger core survival experience.

## Evaluation

### **Heuristic Evaluation**
| **Interface** | **Issue** | **Heuristics** | **Frequency 0 (rare) to 4 (common)** | **Impact 0 (easy) to difficult (4)** | **Persistence (once) to 4 (repeated)** | **Severity** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Game play interface** | Vehicle color contrast could be more noticeable, and drift trajectory highlighted | Visibility of system status | 2 | 1 | 3 | 2 |
| **Game running interface - Map boundary / Collision system** | Lack of obvious pause and restart buttons during the game. Players easily hit walls suddenly due to limited vision, lacking advance warnings. | User control and freedom | 2 | 3 | 3 | 3 |
| **Game running interface - Map boundary / Collision system** | Lack of obvious pause and restart buttons during the game. Players easily hit walls suddenly due to limited vision, lacking advance warnings. | Error prevention | 2 | 3 | 2 | 2 |
| **Game interaction** | The initial version of the game lacks prompts for interaction, which may increase the user's memory load | Recognition rather than recall | 2 | 2 | 1 | 2 |
| **Difficulty system** | The initial version of the game lacks difficulty options, unable to meet the needs of players of different skill levels. | Flexibility and efficiency of use | 4 | 3 | 3 | 4 |
| **Game interface design** | The aesthetics of the game interface design could be improved | Aesthetic and minimalist design | 1 | 2 | 2 | 4 |

---
### Findings of User's Evaluation

- **Visual Feedback & System Status (Visibility of system status / Aesthetic design):** The color contrast of the vehicles is too weak, and the drifting trajectory needs to be highlighted. Additionally, crucial power-ups like health packs and shields lack visibility and are easily overlooked by players. The overall aesthetics of the game interface could also be improved.

- **User Control & Error Prevention:** The main gameplay interface lacks obvious pause and restart buttons. Due to restricted vision, players frequently crash into walls without warning, highlighting a severe lack of advance map boundary cues.

- **Cognitive Load & Onboarding:** The initial version lacks clear interaction prompts, increasing the user's memory load. There are no explicit movement instructions (e.g., move/stop), which should be placed at the top of the interface. Furthermore, there is no transition prompt indicating "press to start" before gameplay begins.

- **Gameplay Clarity:** The core mechanics are poorly communicated; players are not explicitly informed of the win conditions, nor is it clear whether they should dodge or collide with NPCs.

- **System Flexibility:** The game currently lacks a difficulty selection system, failing to accommodate players of different skill levels.
---

### Qualitative Evaluation

- **Misalignment in Core Objective Communication:** 
Despite the asymmetric "Chase & Evasion" design, the UI fails to convey these rules. Players experience a steep learning curve due to confusion over victory conditions and NPC interaction logic (i.e., damage vs. evasion). Mandatory movement and objective prompts must be integrated directly into the HUD.

- **Visual Hierarchy and Player Frustration:** 
Essential interactive elements—such as player vehicles, health packs, and shields—blend into the background due to low contrast. Combined with the lack of collision warnings at map boundaries, this results in "cheap" deaths (e.g., sudden wall crashes) that punish players for UI shortcomings rather than lack of skill.

- **Lack of Dynamic Progression and Replayability:** 
The current loop is too shallow. To enhance strategic depth, the game requires a level progression system featuring randomized building styles and positions upon completing a stage. Combat variety must be expanded with new weapon types, such as projectiles that ricochet off buildings. Crucially, the implementation of at least two difficulty tiers—achieved by altering game speed, enemy toughness, or power-up availability—is necessary to sustain long-term engagement for both novice and expert players.


### Quantitative Evaluation
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

The low average SUS score and NASA TLX score themselves show that it is **necessary for us to improve overall user experience in all aspects.** While the NASA TLX score for hard being higher than easy difficulty shows that there is a clear learning effect within the data, and that the suggestion to add a tutorial to the game (by one of the test users) is a very good way to enhance user experience. On the other hand, both Wilcoxon Signed-Rank Tests showing no statistically significant differences, meaning that the easy difficulty and the hard difficulty are too close to each other in terms of gameplay experience, **so the 3 difficulties should be readjusted.**


### Technical challenges

1. Unintended bugs caused by the interaction of the timer and shop mechanics

2. Missile flying out of the map indefinitely (which locks player control) bug.

## Your Group

GROUP PHOTO. 
<img width="1707" height="1280" alt="image" src="https://github.com/user-attachments/assets/ac7c8d00-a52d-4c9e-89f2-0bc5ce44d51c" />


-Meb1：Li Ka Fai; Email: gavins092590@gmail.com; Role：

-Meb2：Yanqing Peng; Email：ai25403@bristol.ac.uk; Role：

-Meb3：Ping Yu Sung; Email：yo25075@bristol.ac.uk; Role：

-Meb4：Fan Lin; Email：zs25891@bristol.ac.uk; Role：

-Meb5：FuQiuting; Email：rm25551@bristol.ac.uk; Role：

-Meb6：Jizhe Jin; Email：hy25163@bristol.ac.uk;  Role：

## Project Report

### Introduction

- 5% ~250 words 
- Describe your game, what is based on, what makes it novel? (what's the "twist"?) 

### Requirements 

- 15% ~750 words
- Early stages design. Ideation process. How did you decide as a team what to develop? Use case diagrams, user stories. 

### Design

- 15% ~750 words 
- System architecture. Class diagrams, behavioural diagrams.

#### Class Diagram

<p align="center">
<img width="900" src="https://github.com/user-attachments/assets/e7fe663c-dcdc-4e9a-83f5-2d2b78157599">
</p>

#### Sequence Diagram

<p align="center">
<img width="700" src="https://github.com/user-attachments/assets/2391da13-6c32-4bfa-9a6f-36ba9dfcdc1f">
</p>


### Implementation

- 15% ~750 words

- Describe implementation of your game, in particular highlighting the TWO areas of *technical challenge* in developing your game. 

### Evaluation

- 15% ~750 words

- One qualitative evaluation (of your choice) 

- One quantitative evaluation (of your choice) 

- Description of how code was tested. 

### Process 

- 15% ~750 words

- Teamwork. How did you work together, what tools and methods did you use? Did you define team roles? Reflection on how you worked together. Be honest, we want to hear about what didn't work as well as what did work, and importantly how your team adapted throughout the project.

### Conclusion

- 10% ~500 words

- Reflect on the project as a whole. Lessons learnt. Reflect on challenges. Future work, describe both immediate next steps for your current game and also what you would potentially do if you had chance to develop a sequel.

### Contribution Statement

- Provide a table of everyone's contribution, which *may* be used to weight individual grades. We expect that the contribution will be split evenly across team-members in most cases. Please let us know as soon as possible if there are any issues with teamwork as soon as they are apparent and we will do our best to help your team work harmoniously together.

### Additional Marks

You can delete this section in your own repo, it's just here for information. in addition to the marks above, we will be marking you on the following two points:

- **Quality** of report writing, presentation, use of figures and visual material (5% of report grade) 
  - Please write in a clear concise manner suitable for an interested layperson. Write as if this repo was publicly available.
- **Documentation** of code (5% of report grade)
  - Organise your code so that it could easily be picked up by another team in the future and developed further.
  - Is your repo clearly organised? Is code well commented throughout?
