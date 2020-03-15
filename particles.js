/*
 * particles.js: a simple particle interaction simulation
 */

//////////////////////////////
// GLOBAL VARIABLES
//
let constants = {
  canvas: document.querySelector('#canv'),
  ctx: document.querySelector('#canv').getContext('2d', {alpha:false}),
  clear_color: '#333333',
  n_particles: 100,
  particle_size: 10,
  max_vel: 5,
  max_force: 100,
  max_radius: 50,
  trail_length: 10,
  trail_style: 1,
  air_resistance: 0,
  gravitational_constant: 1000*1000
};

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

  /* Draw circle around mouse if held */
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
    /* Draw particle trail */
    // Double equals are not an error -- triple equals always returns false after selecting an option in dat.GUI
    if(constants.trail_style == 0){
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
    } else if(constants.trail_style == 1){
      let conformed_velocity = {
        x: particle.state.vel.x*constants.trail_length,
        y: particle.state.vel.y*constants.trail_length
      };

      if(Math.abs(conformed_velocity.x) > constants.max_vel*constants.trail_length){
        conformed_velocity.x = constants.max_vel*constants.trail_length * Math.sign(conformed_velocity.x);
      }
      if(Math.abs(conformed_velocity.y) > constants.max_vel*constants.trail_length){
        conformed_velocity.y = constants.max_vel*constants.trail_length * Math.sign(conformed_velocity.y);
      }

      constants.ctx.fillStyle = particle.props.draw_color + '33';
      constants.ctx.beginPath();
      constants.ctx.moveTo(particle.state.pos.x-conformed_velocity.x, particle.state.pos.y-conformed_velocity.y);
      constants.ctx.lineTo(particle.state.pos.x-(constants.particle_size/2), particle.state.pos.y-(constants.particle_size/2));
      constants.ctx.lineTo(particle.state.pos.x+(constants.particle_size/2), particle.state.pos.y+(constants.particle_size/2));
      constants.ctx.fill();
    }

    /* Draw particle itself */
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
    draw_color:'#ff0000',
    remove: ()=>{
      delete particle_types.a;
    }
  },
  b: {
    type: 'b',
    forces: {
      a: -1.0,
      b: 1.0,
      c: -1.0
    },
    mass: 1.0,
    draw_color:'#00cc00',
    remove: ()=>{
      delete particle_types.b;
    }
  },
  c: {
    type: 'c',
    forces: {
      a: -1.0,
      b: -1.0,
      c: 1.0
    },
    mass: 1.0,
    draw_color:'#ffff00',
    remove: ()=>{
      delete particle_types.c;
    }
  }
};
let particles = [];

//////////////////////////////
// SIMULATION FUNCTIONS
//
function sim_init(n_particles = constants.n_particles){
  for(let i=0;i<n_particles;i++){
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
    particle.state.vel.y += f_net_y*Math.cos(theta)/particle.props.mass; // Not certain why sine doesn't work properly here
  });
}

//////////////////////////////
// DAT.GUI
//
let gui = new dat.GUI();

function gui_init(){
  let folder_particles = gui.addFolder('Particle Properties');

  let temp = {add:()=>{
    let name = Math.floor(Math.random()*1000).toString(16);
    let forces = {};
    forces[name] = [-1.0,1.0][Math.floor(Math.random()*2)];
    for(let key in particle_types){
      forces[key] = [-1.0, 1.0][Math.floor(Math.random()*2)];
      particle_types[key].forces[name] = [-1.0, 1.0][Math.floor(Math.random()*2)];
      folder_particles.__folders[key].__folders['Interactions'].add(particle_types[key].forces, name).name(`With ${name}`);
    }
    particle_types[name] = {
      type: name,
      forces,
      mass: 1.0,
      draw_color: `#${(0xFFFFFF*Math.random()).toFixed(0).toString(16).slice(0, 6)}`,
      remove: ()=>{
        delete particle_types[name];
      }
    };

    particles = [];
    add_particle_folder(name);
    sim_init();
  }};
  folder_particles.add(temp, 'add').name('Add New');

  function add_particle_folder(key){
    let folder = folder_particles.addFolder(key);
    folder.add(particle_types[key], 'mass').name('Mass');
    folder.addColor(particle_types[key], 'draw_color').name('Color');
    let subfolder = folder.addFolder('Interactions');
    for(let key_force in particle_types[key].forces){
      subfolder.add(particle_types[key].forces, key_force).name(`With ${key_force}`);
    }

    let remove_controller = folder.add(particle_types[key], 'remove').name('Remove');
    // Two different approaches are used between this and add_controller, potential
    //   TODO is to ensure uniformity
    // Beyond this, this solution feels clunky and inelegant despite it working
    remove_controller.onFinishChange(()=>{
      particles = [];
      folder_particles.removeFolder(folder);
      for(let particle_subfolder in folder_particles.__folders){
        let interactions_subfolder = folder_particles.__folders[particle_subfolder].__folders['Interactions'];
        interactions_subfolder.__controllers.forEach((particle_controller)=>{
          if(particle_controller.property === key){
            interactions_subfolder.remove(particle_controller);
          }
        });
      }
      sim_init();
    });
  }
  for(let key in particle_types){
    add_particle_folder(key);
  }

  let folder_simulation = gui.addFolder('Simulation Properties');

  let n_particles_controller = folder_simulation.add(constants, 'n_particles').name('# of Particles');
  n_particles_controller.onFinishChange((val)=>{
    let val_rounded = Math.round(val);
    while(particles.length > val_rounded){
      particles.shift();
    }
    if(particles.length < val_rounded){
      sim_init(val_rounded-particles.length);
    }
  });

  folder_simulation.add(constants, 'max_vel').name('Max Velocity');
  folder_simulation.add(constants, 'max_force').name('Max Net Force');
  folder_simulation.add(constants, 'max_radius').name('Attraction Radius');
  folder_simulation.add(constants, 'air_resistance').name('Air Resistance');
  folder_simulation.add(constants, 'gravitational_constant').name('Grav. Constant');

  let folder_render = gui.addFolder('Render Properties');
  folder_render.addColor(constants, 'clear_color').name('Bgd. Color');
  folder_render.add(constants, 'particle_size').name('Particle Size');
  folder_render.add(constants, 'trail_length').name('Trail Length');
  folder_render.add(constants, 'trail_style', {gradient_laggy: 0, fast: 1}).name('Trail Style');

  let folder_mouse = gui.addFolder('Mouse Properties');
  folder_mouse.add(mouse, 'max_radius').name('Force Radius');
  folder_mouse.add(mouse, 'force').name('Force Direction');
}

//////////////////////////////
// STATS
//
let stats = new Stats();

function stats_init(){
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
}

//////////////////////////////
// IMPROVED MOBILE SUPPORT
//
function mobile_init(){
  // A regex/more robust detection method is not necessary here,
  //   as the changes applied are not due to the device being
  //   mobile, but rather due to the small screen size
  if(window.innerWidth <= 800 &&
     window.innerHeight <= 600){
    constants.n_particles = 50;
    constants.trail_length = 15;
    constants.max_vel = 2;
    constants.max_force = 10;
    constants.gravitational_constant = 100*100;
    gui.close();
  }
}

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

function on_mousedown(e){
  e.preventDefault();

  mouse.is_down = true;
  on_mousemove(e);
}

function on_mouseup(){
  mouse.is_down = false;
}

function on_mousemove(e){
  e.preventDefault();

  mouse.pos.x = e.pageX;
  mouse.pos.y = e.pageY;
}

function listeners_init(){
  window.addEventListener('resize', on_resize);

  constants.canvas.addEventListener('mousedown', on_mousedown);
  constants.canvas.addEventListener('mouseup',   on_mouseup  );
  constants.canvas.addEventListener('mousemove', on_mousemove);

  constants.canvas.addEventListener('touchstart', on_mousedown);
  constants.canvas.addEventListener('touchend',   on_mouseup  );
  constants.canvas.addEventListener('touchmove',  on_mousemove);
}

mobile_init();
gui_init();
stats_init();
listeners_init();
canv_init();
sim_init();

loop();
