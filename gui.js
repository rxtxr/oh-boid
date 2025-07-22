export function setupGUI(boids) {
    const maxSpeedInput = document.getElementById('max-speed');
    const alignmentInput = document.getElementById('alignment-strength');
    const cohesionInput = document.getElementById('cohesion-strength');
    const separationInput = document.getElementById('separation-strength');
  
    if (!maxSpeedInput || !alignmentInput || !cohesionInput || !separationInput) {
      console.warn("GUI-Elemente nicht gefunden – GUI wird nicht aktiviert.");
      return;
    }
  
    function updateParameters() {
      const maxSpeed = parseFloat(maxSpeedInput.value);
      const alignment = parseFloat(alignmentInput.value);
      const cohesion = parseFloat(cohesionInput.value);
      const separation = parseFloat(separationInput.value);
  
      for (const boid of boids) {
        boid.maxSpeed = maxSpeed;
        boid.alignmentStrength = alignment;
        boid.cohesionStrength = cohesion;
        boid.separationStrength = separation;
      }
    }
  
    maxSpeedInput.addEventListener('input', updateParameters);
    alignmentInput.addEventListener('input', updateParameters);
    cohesionInput.addEventListener('input', updateParameters);
    separationInput.addEventListener('input', updateParameters);
  
    updateParameters(); // Direkt initial setzen
  }
  