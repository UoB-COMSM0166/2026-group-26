# 2026-group-26
2026 COMSM0166 group 26

# COMSM0166 Project Template
A project template for the Software Engineering Discipline and Practice module (COMSM0166).

## Info

This is the template for your group project repo/report. We'll be setting up your repo and assigning you to it after the group forming activity. You can delete this info section, but please keep the rest of the repo structure intact.

You will be developing your game using [P5.js](https://p5js.org) a javascript library that provides you will all the tools you need to make your game. However, we won't be teaching you javascript, this is a chance for you and your team to learn a (friendly) new language and framework quickly, something you will almost certainly have to do with your summer project and in future. There is a lot of documentation online, you can start with:

- [P5.js tutorials](https://p5js.org/tutorials/) 
- [Coding Train P5.js](https://thecodingtrain.com/tracks/code-programming-with-p5-js) course - go here for enthusiastic video tutorials from Dan Shiffman (recommended!)

## Inspiration & Initial Idea

### Inspiration
Our game design is deeply influenced by the primal thrill of "Hunter vs. Hunted." We drew inspiration from several classic and modern titles to define our core mechanics:
- Pac-Man: The foundational concept of navigating a confined space while avoiding enemies. It taught us the importance of map layout and power-ups in changing the tide of the game.
- Need for Speed: This served as our main reference for the Vehicle aspect. We analyzed how high-speed chases create tension and how the "Police vs. Racer" dynamic offers two distinct but equally fun experiences.


### Initial Idea
We proposed four distinct directions:
1.  Text-Based Adventure: A narrative-heavy game focusing on choices and story.
2.  Simulation/Construction Game: A "Design Game" allowing players to build structures or manage resources.
3.  Top-Down Stealth: A slow-paced strategy game focusing on vision cones and sneaking.
4.  Chase & Evasion: A fast-paced action game focusing on reaction speed and movement.
![99d9df15929ce33a47a437c35f938bcf](https://github.com/user-attachments/assets/d0e35714-b8f4-446c-a7a6-94ee79cab433)

## Two paper prototype ideas
### Chase & Evasion:
1: Top-Down Vehicle Survival (Chase & Evasion)
- Role: The player acts as the Evader.
- Controls The player navigates a vehicle using directional keys (Up/Down/Left/Right) and a Braking mechanic to control momentum and make tight turns.
- Item System:
    1.  Repair Kit Restores Health Points (HP) but cannot exceed the maximum HP cap.
    2.  Shield Generator Provides a temporary barrier that negates damage from one collision with the Chaser. The shield breaks immediately after use.
- Win Condition: Survival. The player must avoid the Chaser and keep their HP above zero for 10 minutes.


2: Ricochet Space Arena (Multiplayer Shooter)
- Setup: Four players each control a spaceship within their own designated quadrant of the map.
- Combat Mechanics:
    1. Players shoot projectiles that ricochet (bounce) off map boundaries.
    2. Escalating Difficulty: Projectile speed increases over time, making the arena progressively more dangerous.
- Elimination System:
    1. Each player starts with 3 HP. Being hit reduces HP by 1.
    2. When a player reaches 0 HP, they are eliminated, and their quadrant is permanently closed.
    3. Closed quadrants become solid walls, further reducing the play area and increasing the frequency of bullet reflections.
- Win Condition: Battle Royale style—the last surviving player wins.


## Hotline Escape

### Final idea
Our final idea is a vehicle-based chase and evasion game featuring asymmetric gameplay. Players can choose to play as either the Chaser or the Evader.

#### Role: The Evader
The Evader's goal is to survive while being hunted.
- Health System: The Evader has a limited number of lives (HP). Each collision with the Chaser results in -1 HP. If HP drops to zero, the game ends.
- Victory Condition:  We are currently discussing whether the win condition should be based on surviving for a set duration or collecting a specific number of items.
- Power-ups: The Evader can collect items in the game environment to gain temporary buffs, such as:
  - Speed Boost: Increases movement speed.
  - Shield: Negates the damage from the next collision.
  - Repair: Restores 1 HP (up to the maximum limit).

#### Role: The Chaser
The Chaser's goal is to destroy the Evader within the time limit.
- Mechanics: The Chaser is invulnerable (no HP limit).
- Objective: The primary goal is to collide with the Evader. Successfully reducing the Evader's HP to zero results in Victory.
- Defeat Condition: If the time limit expires before the Evader is destroyed, the Chaser loses.
- Power-ups: We are currently discussing whether the Chaser will also have access to specific power-ups to aid in the pursuit.

#### Paper prototype
![IMG_3473](https://github.com/user-attachments/assets/4e81a92a-ebd1-44c2-ab46-44a279080995)


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
