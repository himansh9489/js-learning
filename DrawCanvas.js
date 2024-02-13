const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");

// Function to draw a line between two points
function drawLine(startX, startY, endX, endY) {
  ctx.beginPath();
  ctx.moveTo(startX, startY); // Starting point (x, y)
  ctx.lineTo(endX, endY); // Ending point (x, y)
  ctx.strokeStyle = "black"; // Color of the line
  ctx.lineWidth = 1; // Width of the line
  ctx.stroke();
}
function drawCircle(centerX, centerY, radius) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); // Arc parameters (x, y, radius, startAngle, endAngle)
  ctx.strokeStyle = "red"; // Color of the circle outline
  ctx.lineWidth = 2; // Width of the circle outline
  ctx.stroke();
}
function drawPolygon(centerX, centerY, radius, sides) {
  ctx.beginPath();
  const angle = (Math.PI * 2) / sides; // Angle between each side
  for (let i = 0; i < sides; i++) {
    const x = centerX + radius * Math.cos(angle * i);
    const y = centerY + radius * Math.sin(angle * i);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath(); // Close the path to complete the polygon
  ctx.strokeStyle = "blue"; // Color of the polygon outline
  ctx.lineWidth = 2; // Width of the polygon outline
  ctx.stroke();
}

// Call the drawLine function with coordinates
drawLine(50, 50, 200, 100);

// Call the drawCircle function with center coordinates and radius
drawCircle(150, 150, 50);

// Call the drawPolygon function with center coordinates, radius, and number of sides
drawPolygon(150, 150, 50, 7); // Draw a hexagon
