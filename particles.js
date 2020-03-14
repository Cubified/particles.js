/*
 * particles.js: a simple particle interaction simulation
 */

//////////////////////////////
// CONSTANTS
//
const constants = {
  canvas: document.querySelector('#canv'),
  clear_color: '#333333',
  n_particles: 100,
  particle_size: 10,
  max_vel: 5,
  max_force: 100,
  max_radius: 50,
  trail_length: 10,
  air_resistance: 0,
  gravitational_constant: 1000*1000
};
constants.ctx = constants.canvas.getContext('2d');

//////////////////////////////
// GLOBAL VARIABLES
//
let mouse = {
  is_down: false,
  pos: {x: 0, y: 0},
  max_radius: 200,
  force: -1
};

//////////////////////////////
// DRAW FUNCTIONS
//
function canv_init(){
  on_resize();
}

function canv_clear(){
  constants.ctx.fillStyle = constants.clear_color;
  constants.ctx.fillRect(0, 0, constants.canvas.width, constants.canvas.height);
}

function canv_draw(){
  canv_clear();

  if(mouse.is_down){
    constants.ctx.fillStyle = '#ffffff33';
    constants.ctx.beginPath();
    constants.ctx.arc(
      mouse.pos.x,
      mouse.pos.y,
      mouse.max_radius/2,
      0,
      2*Math.PI
    );
    constants.ctx.fill();
  }

  particles.forEach((particle)=>{
    particle.state.pos_past.forEach((trail, ind)=>{
      constants.ctx.fillStyle = particle.props.draw_color + Number((0xFF - (0xFF*ind/constants.trail_length)).toFixed(0)).toString(16);
      constants.ctx.beginPath();
      constants.ctx.arc(
        trail.x,
        trail.y,
        constants.particle_size/2,
        0,
        2*Math.PI
      );
      constants.ctx.fill();
    });
    constants.ctx.fillStyle = particle.props.draw_color;
    constants.ctx.beginPath();
    constants.ctx.arc(
      particle.state.pos.x,
      particle.state.pos.y,
      constants.particle_size/2,
      0,
      2*Math.PI
    );
    constants.ctx.fill();
  });
}

//////////////////////////////
// SIMULATION VARIABLES
//
let particle_types = {
  a: {
    type: 'a',
    forces: {
      a: 1.0,
      b: -1.0,
      c: -1.0
    },
    mass: 1.0,
    draw_color:'#ff0000'
  },
  b: {
    type: 'b',
    forces: {
      a: -1.0,
      b: 1.0,
      c: -1.0
    },
    mass: 1.0,
    draw_color:'#009900'
  },
  c: {
    type: 'c',
    forces: {
      a: -1.0,
      b: -1.0,
      c: 1.0
    },
    mass: 1.0,
    draw_color:'#ffff00'
  }
};
let particles = [];

//////////////////////////////
// SIMULATION FUNCTIONS
//
function sim_init(n_particles){
  let n = n_particles;
  if(n === undefined){
    n = constants.n_particles;
  }
  for(let i=0;i<n;i++){
    let part = {
      state: {
        pos: {
          x: Math.random()*constants.canvas.width,
          y: Math.random()*constants.canvas.height,
        },
        vel: {
          x: (Math.random()-0.5)*constants.max_vel,
          y: (Math.random()-0.5)*constants.max_vel
        },
        pos_past: []
      },
      props: sim_particle()
    };
    particles.push(part);
  }
}

function sim_particle(){
  let keys = Object.keys(particle_types);
  return particle_types[keys[Math.floor(Math.random()*keys.length)]];
}

function sim_dist(pos1, pos2){
  return Math.sqrt(Math.pow(pos1.x-pos2.x, 2) + Math.pow(pos1.y-pos2.y, 2));
}

function sim_update(){
  particles.forEach((particle)=>{
    /* Trail */
    particle.state.pos_past.unshift({
      x: particle.state.pos.x,
      y: particle.state.pos.y
    });

    while(particle.state.pos_past.length > constants.trail_length){
      particle.state.pos_past.pop();
    }
  
    /* Update position and velocity */
    particle.state.pos.x += particle.state.vel.x;
    particle.state.pos.y += particle.state.vel.y;

    if(Math.abs(particle.state.vel.x) > constants.air_resistance){
      particle.state.vel.x -= constants.air_resistance * Math.sign(particle.state.vel.x);
    } else {
      particle.state.vel.x = 0;
    }

    if(Math.abs(particle.state.vel.y) > constants.air_resistance){
      particle.state.vel.y -= constants.air_resistance * Math.sign(particle.state.vel.y);
    } else {
      particle.state.vel.y = 0;
    }
   
    if(Math.abs(particle.state.vel.x) > constants.max_vel){
      particle.state.vel.x = constants.max_vel * Math.sign(particle.state.vel.x);
    }
    if(Math.abs(particle.state.vel.y) > constants.max_vel){
      particle.state.vel.y = constants.max_vel * Math.sign(particle.state.vel.y);
    }

    /* Screen wrapping */
    if(particle.state.pos.x <= -constants.particle_size){
      particle.state.pos.x = constants.canvas.width;
    }
    if(particle.state.pos.x >= constants.canvas.width+constants.particle_size){
      particle.state.pos.x = 0;
    }
    
    if(particle.state.pos.y <= -constants.particle_size){
      particle.state.pos.y = constants.canvas.height;
    }
    if(particle.state.pos.y >= constants.canvas.height+constants.particle_size){
      particle.state.pos.y = 0;
    }

    /* Calculate gravitation */
    let f_net_x = 0,
        f_net_y = 0,
        r = 0,
        theta = 0;
    particles.forEach((grav_particle)=>{
      if(particle !== grav_particle){
        r = sim_dist(grav_particle.state.pos, particle.state.pos);
        theta = Math.atan(r);
        if(r === 0){
          r = 0.1;
        }
        if(r <= constants.max_radius){
          f_net_x += Math.sign(grav_particle.state.pos.x-particle.state.pos.x)*constants.gravitational_constant*particle.props.forces[grav_particle.props.type]/r;
          f_net_y += Math.sign(grav_particle.state.pos.y-particle.state.pos.y)*constants.gravitational_constant*particle.props.forces[grav_particle.props.type]/r;
        }
      }
    });
    // (Held mouse acts a repulsion force)
    if(mouse.is_down){
      r = sim_dist(mouse.pos, particle.state.pos);
      if(r === 0){
        r = 0.1;
      }
      if(r <= mouse.max_radius){
        f_net_x += Math.sign(mouse.pos.x-particle.state.pos.x)*constants.gravitational_constant*mouse.force/r;
        f_net_y += Math.sign(mouse.pos.y-particle.state.pos.y)*constants.gravitational_constant*mouse.force/r;
      }
    }
    if(Math.abs(f_net_x) > constants.max_force){
      f_net_x = constants.max_force * Math.sign(f_net_x);
    }
    if(Math.abs(f_net_y) > constants.max_force){
      f_net_y = constants.max_force * Math.sign(f_net_y);
    }
    particle.state.vel.x += f_net_x*Math.cos(theta)/particle.props.mass;
    particle.state.vel.y += f_net_y*Math.cos(theta)/particle.props.mass; /* Not certain why sine doesn't work properly here */
  });
}

//////////////////////////////
// DAT.GUI
//
let gui = new dat.GUI();
let folder_particles = gui.addFolder('Particle Properties');
for(let key in particle_types){
  let folder = folder_particles.addFolder(key);
  folder.add(particle_types[key], 'mass');
  folder.add(particle_types[key], 'draw_color');
  let subfolder = folder.addFolder('Interactions');
  for(let key_force in particle_types[key].forces){
    subfolder.add(particle_types[key].forces, key_force);
  }
}

let folder_simulation = gui.addFolder('Simulation Properties');

let n_particles_controller = folder_simulation.add(constants, 'n_particles');
n_particles_controller.onFinishChange((val)=>{
  let val_rounded = Math.round(val);
  while(particles.length > val_rounded){
    particles.shift();
  }
  if(particles.length < val_rounded){
    sim_init(val_rounded-particles.length);
  }
});

folder_simulation.add(constants, 'max_vel');
folder_simulation.add(constants, 'max_force');
folder_simulation.add(constants, 'max_radius');
folder_simulation.add(constants, 'air_resistance');
folder_simulation.add(constants, 'gravitational_constant');

let folder_render = gui.addFolder('Render Properties');
folder_render.add(constants, 'clear_color');
folder_render.add(constants, 'particle_size');
folder_render.add(constants, 'trail_length');

let folder_mouse = gui.addFolder('Mouse Properties');
folder_mouse.add(mouse, 'max_radius');
folder_mouse.add(mouse, 'force');

//////////////////////////////
// STATS
//
let stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

//////////////////////////////
// RENDER LOOP AND LISTENERS
//
function loop(){
  stats.begin();

  canv_draw();
  
  sim_update();

  stats.end();
  
  requestAnimationFrame(loop);
}

function on_resize(){
  constants.canvas.width = window.innerWidth;
  constants.canvas.height = window.innerHeight;
}

function on_mousedown(){
  mouse.is_down = true;
}

function on_mouseup(){
  mouse.is_down = false;
}

function on_mousemove(e){
  mouse.pos.x = e.clientX;
  mouse.pos.y = e.clientY;
}

window.addEventListener('resize', on_resize);
constants.canvas.addEventListener('mousedown', on_mousedown);
constants.canvas.addEventListener('mouseup',   on_mouseup  );
constants.canvas.addEventListener('mousemove', on_mousemove);
canv_init();
sim_init();
loop();
