export function setupGUI(boids, attractor) {
    const maxSpeedInput = document.getElementById('max-speed');
    const alignmentInput = document.getElementById('alignment-strength');
    const cohesionInput = document.getElementById('cohesion-strength');
    const separationInput = document.getElementById('separation-strength');
    const perceptionInput = document.getElementById('perception-radius');
    const attractorInput = document.getElementById('attractor-strength');
  
    if (!maxSpeedInput || !alignmentInput || !cohesionInput || !separationInput || !perceptionInput || !attractorInput) {
      console.warn("GUI-Elemente nicht gefunden – GUI wird nicht aktiviert.");
      return;
    }
  
    function updateParameters() {
      const maxSpeed = parseFloat(maxSpeedInput.value);
      const alignment = parseFloat(alignmentInput.value);
      const cohesion = parseFloat(cohesionInput.value);
      const separation = parseFloat(separationInput.value);
        const perception = parseFloat(perceptionInput.value);
        const attract = parseFloat(attractorInput.value);
  
      for (const boid of boids) {
        boid.maxSpeed = maxSpeed;
        boid.alignmentStrength = alignment;
        boid.cohesionStrength = cohesion;
        boid.separationStrength = separation;
        boid.perceptionRadius = perception;
      }
        if (attractor) {
          attractor.strength = attract;
        }
    }
  
    maxSpeedInput.addEventListener('input', updateParameters);
    alignmentInput.addEventListener('input', updateParameters);
    cohesionInput.addEventListener('input', updateParameters);
    separationInput.addEventListener('input', updateParameters);
    perceptionInput.addEventListener('input', updateParameters);
    attractorInput.addEventListener('input', updateParameters);
  
    updateParameters(); // Direkt initial setzen
  }
