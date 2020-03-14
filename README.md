## particles.js

An in-browser particle interaction simulation.

[Try now](https://cubified.github.io/particles.js)

### Overview

All particles hold the following properties:

- Position (x, y)
- Velocity (x, y)
- Type
- Strength of attraction/repulsion to adjacent particles based on their types

On each frame, each particle's position is updated using its velocity vector, and its velocity is updated as follows:

- Initialize the particle's net force vector as 0 in both the x and y directions
- Iterate over every other particle, calculating the distance and angle of depression/elevation for each
- If the particles being evaluated are within some arbitrary distance, add to the net force vector using the following formula:
  - `(sign(particle2.x or .y - particle1.x or .y) * gravitational_constant * interaction_force)/dist(particle2, particle1)`
  - In English:
    - The particle that is past the other should experience a leftward force, while the particle that is behind the other should experience a rightward force (`sign(...)`)
    - The attractive/repulsive strength decreases as the distance between the two particles increases (`interaction_force/dist(...)`)
- Add the x and y components of the net force vector to the x and y components of the velocity respectively, dividing first by the particle's mass
