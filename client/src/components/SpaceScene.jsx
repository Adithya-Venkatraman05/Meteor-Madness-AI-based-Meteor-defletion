import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const SpaceScene = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const orbitsRef = useRef([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    mountRef.current.appendChild(renderer.domElement);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Central sphere (sun) - much larger for prominence
    const nucleusGeometry = new THREE.SphereGeometry(2.0, 32, 32);
    const nucleusMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    scene.add(nucleus);

    // Solar system planets configuration (greyscale colors, much larger sizes)
    const planetConfigs = [
      { name: 'Mercury', distance: 4.5, size: 0.25, speed: 0.020, color: 0x666666 },
      { name: 'Venus', distance: 6.0, size: 0.32, speed: 0.016, color: 0x888888 },
      { name: 'Earth', distance: 7.5, size: 0.34, speed: 0.012, color: 0xaaaaaa },
      { name: 'Mars', distance: 9.5, size: 0.28, speed: 0.010, color: 0x777777 },
      { name: 'Jupiter', distance: 13.0, size: 0.65, speed: 0.006, color: 0x999999 },
      { name: 'Saturn', distance: 17.0, size: 0.55, speed: 0.004, color: 0xbbbbbb },
      { name: 'Uranus', distance: 21.0, size: 0.45, speed: 0.003, color: 0x888888 },
      { name: 'Neptune', distance: 25.0, size: 0.42, speed: 0.002, color: 0x666666 },
      { name: 'Pluto', distance: 29.0, size: 0.22, speed: 0.001, color: 0x555555 }
    ];

    const planets = [];
    const comets = [];
    let lastCometTime = 0;
    const cometSpawnInterval = 1500; // 1.5 seconds between comets for higher frequency

    // Create planets
    planetConfigs.forEach((planetConfig, index) => {
      const planetGeometry = new THREE.SphereGeometry(planetConfig.size, 16, 16);
      const planetMaterial = new THREE.MeshBasicMaterial({ 
        color: planetConfig.color,
        transparent: true,
        opacity: 0.9
      });
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      
      // Set initial position - start at random angles for variety
      const initialAngle = Math.random() * Math.PI * 2;
      planet.position.x = Math.cos(initialAngle) * planetConfig.distance;
      planet.position.z = Math.sin(initialAngle) * planetConfig.distance;
      planet.position.y = 0; // Keep planets in the same plane
      
      scene.add(planet);
      
      planets.push({
        mesh: planet,
        angle: initialAngle,
        distance: planetConfig.distance,
        speed: planetConfig.speed,
        name: planetConfig.name
      });
    });

    orbitsRef.current = planets;

    // Function to create a new comet - ALWAYS with integrated streak
    const createComet = () => {
      // Create starting position
      const startX = 40 + Math.random() * 10;
      const startY = 20 + Math.random() * 10;
      const startZ = -10 + Math.random() * 20;
      
      // Comet head - always part of comet-streak combo
      const cometGeometry = new THREE.SphereGeometry(0.12, 12, 12);
      const cometMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 1.0
      });
      const comet = new THREE.Mesh(cometGeometry, cometMaterial);
      
      // MANDATORY streak - every comet MUST have a streak
      const streakLength = 10; // Slightly longer for better visibility
      const streakPoints = [];
      
      // Initialize streak points extending behind the comet
      for (let i = 0; i < streakLength; i++) {
        const offset = i * 1.0; // Spacing between streak points
        streakPoints.push(new THREE.Vector3(
          startX + offset * 0.8,  // Streak extends back opposite to direction of travel
          startY + offset * 0.5,
          startZ - offset * 0.2
        ));
      }
      
      const streakGeometry = new THREE.BufferGeometry().setFromPoints(streakPoints);
      const streakMaterial = new THREE.LineBasicMaterial({ 
        color: 0xbbbbbb,
        transparent: true,
        opacity: 0.8
      });
      const streak = new THREE.Line(streakGeometry, streakMaterial);
      
      // Position comet at the front of the streak
      comet.position.set(startX, startY, startZ);
      
      scene.add(comet);
      scene.add(streak);
      
      const cometSpeed = 0.5 + Math.random() * 0.4; // Fast speed for dramatic effect
      
      comets.push({
        mesh: comet,
        streak: streak,
        speed: cometSpeed,
        life: 0,
        maxLife: 250, // Shorter lifespan for more frequent appearance
        streakPoints: streakPoints,
        direction: {
          x: -0.8,
          y: -0.5,
          z: 0.2
        }
      });
    };

    // Camera position - positioned to view the larger solar system from above at an angle
    camera.position.z = 35;
    camera.position.y = 15;
    camera.lookAt(0, 0, 0);

    // Animation loop - animate nucleus and particles
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate nucleus slowly
      nucleus.rotation.y += 0.005;

      // Animate planets orbiting around the sun
      planets.forEach((planet) => {
        planet.angle += planet.speed;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
        // Add slight planet rotation
        planet.mesh.rotation.y += 0.01;
      });

      // Spawn new comets periodically
      const currentTime = Date.now();
      if (currentTime - lastCometTime > cometSpawnInterval) {
        createComet();
        lastCometTime = currentTime;
      }

      // Animate comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const comet = comets[i];
        comet.life++;
        
        // Move comet and streak together as one unit
        const movement = {
          x: comet.direction.x * comet.speed,
          y: comet.direction.y * comet.speed,
          z: comet.direction.z * comet.speed
        };
        
        comet.mesh.position.x += movement.x;
        comet.mesh.position.y += movement.y;
        comet.mesh.position.z += movement.z;
        
        // Update all streak points to follow the comet
        for (let j = 0; j < comet.streakPoints.length; j++) {
          comet.streakPoints[j].x += movement.x;
          comet.streakPoints[j].y += movement.y;
          comet.streakPoints[j].z += movement.z;
        }
        comet.streak.geometry.setFromPoints(comet.streakPoints);
        
        // Fade out comet and streak together
        const fadeRatio = Math.max(0, 1 - (comet.life / comet.maxLife));
        comet.mesh.material.opacity = fadeRatio * 1.0;
        comet.streak.material.opacity = fadeRatio * 0.7;
        
        // Remove comet if it's too old or too far away
        if (comet.life > comet.maxLife || comet.mesh.position.x < -50) {
          scene.remove(comet.mesh);
          scene.remove(comet.streak);
          comet.mesh.geometry.dispose();
          comet.mesh.material.dispose();
          comet.streak.geometry.dispose();
          comet.streak.material.dispose();
          comets.splice(i, 1);
        }
      }

      // Render the scene
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default SpaceScene;