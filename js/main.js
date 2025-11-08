function setupAudioPlayer() {
   const playButton = document.getElementById("play-button");
   const vinyl = document.getElementById("vinyl");
   const audio = document.getElementById("background-music");

   if (!playButton || !audio || !vinyl) return;

   const updateVisualState = () => {
       if (!audio.paused && !audio.ended) {
           vinyl.classList.add("spinning");
       } else {
           vinyl.classList.remove("spinning");
       }
   };

   audio.addEventListener("play", updateVisualState);
   audio.addEventListener("pause", updateVisualState);
   audio.addEventListener("ended", updateVisualState);

   playButton.addEventListener("click", () => {
       if (audio.paused) {
           audio.play().catch(err => console.warn("Autoplay blocked:", err));
       } else {
           audio.pause();
       }
   });

   // Ensure initial state is synced (e.g., if autoplay blocked)
   updateVisualState();
}
// iPhone Time Stories - D3 Interactive Visualization
let appData = null;
let currentNeighborhood = null;
let currentYear = null;


// Initialize the application
d3.json("data/place_data.json").then(data => {
   appData = data;
   initializeApp();
});


function initializeApp() {
   // Set default selection to High Park for display
   setTimeout(() => {
       currentNeighborhood = appData.neighbourhoods.find(d => d.name === "High Park");
       if (currentNeighborhood) {
           updateYearDropdown();
           updateDisplay();
       }
   }, 100);

   setupAudioPlayer();
}


function updateYearDropdown() {
   if (currentNeighborhood) {
       // Debug: log the current neighborhood and its photos
       console.log("Current neighborhood:", currentNeighborhood);
       console.log("Photos:", currentNeighborhood.photos);
      
       const availableYears = currentNeighborhood.photos.map(photo => photo.year).sort();
       console.log("Available years:", availableYears);
      
       // Auto-select first year (2011 for High Park)
       if (availableYears.length > 0 && !currentYear) {
           currentYear = availableYears[0];
       }
   }
}


function updateDisplay() {
   if (!currentNeighborhood) return;


   // Load both images for split-screen comparison
   const photos = currentNeighborhood.photos.sort((a, b) => a.year - b.year);
   const leftPhoto = photos[0]; // Earlier year (2011)
   const rightPhoto = photos[1]; // Later year (2021)
  
   if (leftPhoto && rightPhoto) {
       // Load left image (2011)
       loadImage("#left-image", leftPhoto.url);
      
       // Load right image (2021)
       loadImage("#right-image", rightPhoto.url);
      
       // Load polaroid image (2011)
       loadImage("#polaroid-image", leftPhoto.url);
      
       // Update left and right labels
       d3.select("#location-year-left").html(`${leftPhoto.year} • <strong>${currentNeighborhood.name}</strong>`);
       d3.select("#location-year-right").html(`<strong>${currentNeighborhood.name}</strong> • Now`);
      
       // Auto-adjust font size to fit max width
       adjustLabelFontSize("#location-year-left", "#location-label-left", 0.8);
       adjustLabelFontSize("#location-year-right", "#location-label-right", 1.2);
      
       // Initialize drag functionality
       initializeDrag();
      
       // Set initial divider position and clip paths
       setInitialPosition();
   }
}


function loadImage(selector, url) {
   const img = new Image();
   const imageElement = d3.select(selector);
  
   img.onload = function() {
       imageElement
           .attr("src", url)
           .classed("loaded", true);
   };
  
   img.onerror = function() {
       console.error("Failed to load image:", url);
   };
  
   img.src = url;
}


function initializeDrag() {
   const divider = d3.select("#divider");
   const leftContainer = d3.select("#left-image-container");
   const rightContainer = d3.select("#right-image-container");
   const screenContent = d3.select("#screen-content");
  
   let isDragging = false;
   let startX = 0;
   let startDividerPosition = 50; // Start at 50%
  
   // Mouse events
   divider.on("mousedown", function(event) {
       isDragging = true;
       startX = event.clientX;
       startDividerPosition = parseFloat(divider.style("left")) || 50;
      
       event.preventDefault();
       document.body.style.cursor = "col-resize";
   });
  
   document.addEventListener("mousemove", function(event) {
       if (!isDragging) return;
      
       const deltaX = event.clientX - startX;
       const screenWidth = screenContent.node().offsetWidth;
       const newDividerPosition = startDividerPosition + (deltaX / screenWidth * 100);
      
       // Calculate max position to prevent divider from extending beyond container
       // Divider is 4px wide, so max position is (width - 4) / width * 100
       const dividerWidth = 4;
       const maxPosition = ((screenWidth - dividerWidth) / screenWidth) * 100;
       const constrainedPosition = Math.max(0, Math.min(maxPosition, newDividerPosition));
      
       // Update clip paths to show/hide parts of each image
       leftContainer.style("clip-path", `inset(0 ${100 - constrainedPosition}% 0 0)`);
       rightContainer.style("clip-path", `inset(0 0 0 ${constrainedPosition}%)`);
       divider.style("left", constrainedPosition + "%");
      
       // Update divider height based on position
       updateDividerHeight(constrainedPosition);
      
       // Update color saturation based on divider position
       updateColorSaturation(constrainedPosition);
   });
  
   document.addEventListener("mouseup", function() {
       if (isDragging) {
           isDragging = false;
           document.body.style.cursor = "default";
       }
   });
  
   // Touch events for mobile
   divider.on("touchstart", function(event) {
       isDragging = true;
       startX = event.touches[0].clientX;
       startDividerPosition = parseFloat(divider.style("left")) || 50;
      
       event.preventDefault();
   });
  
   document.addEventListener("touchmove", function(event) {
       if (!isDragging) return;
      
       const deltaX = event.touches[0].clientX - startX;
       const screenWidth = screenContent.node().offsetWidth;
       const newDividerPosition = startDividerPosition + (deltaX / screenWidth * 100);
      
       // Calculate max position to prevent divider from extending beyond container
       // Divider is 4px wide, so max position is (width - 4) / width * 100
       const dividerWidth = 4;
       const maxPosition = ((screenWidth - dividerWidth) / screenWidth) * 100;
       const constrainedPosition = Math.max(0, Math.min(maxPosition, newDividerPosition));
      
       // Update clip paths to show/hide parts of each image
       leftContainer.style("clip-path", `inset(0 ${100 - constrainedPosition}% 0 0)`);
       rightContainer.style("clip-path", `inset(0 0 0 ${constrainedPosition}%)`);
       divider.style("left", constrainedPosition + "%");
      
       // Update divider height based on position
       updateDividerHeight(constrainedPosition);
      
       // Update color saturation based on divider position
       updateColorSaturation(constrainedPosition);
      
       event.preventDefault();
   });
  
   document.addEventListener("touchend", function() {
       if (isDragging) {
           isDragging = false;
       }
   });
}


function updateDividerHeight(dividerPosition) {
   const divider = d3.select("#divider");
   const screenContent = d3.select("#screen-content");
   const containerHeight = screenContent.node().offsetHeight;
  
   // Calculate smooth height transition based on position
   // At edges (0% and 100%), divider should be shorter due to rounded corners
   // In middle (50%), divider should be full height
  
   let topOffset, height;
  
   // Calculate distance from center (50%)
   const distanceFromCenter = Math.abs(dividerPosition - 50);
  
   // Smooth interpolation between full height (at center) and shorter (at edges)
   const maxShortening = 50; // Maximum pixels to shorten at edges
   const maxTopOffset = 25; // Maximum top offset at edges
  
   // Use a steeper curve for faster transition
   const shorteningFactor = Math.pow(distanceFromCenter / 50, 1.5);
  
   const shortening = shorteningFactor * maxShortening;
   const topOffsetValue = shorteningFactor * maxTopOffset;
  
   // Ensure minimum visible height (at least 100px)
   const minHeight = 100;
   const calculatedHeight = containerHeight - shortening;
   const finalHeight = Math.max(minHeight, calculatedHeight);
  
   // Adjust top offset if height is constrained
   const actualShortening = containerHeight - finalHeight;
   const actualTopOffset = Math.min(topOffsetValue, actualShortening / 2);
  
   topOffset = actualTopOffset;
   height = finalHeight + "px";
  
   divider.style("top", topOffset + "px");
   divider.style("height", height);
}


function updateColorSaturation(dividerPosition) {
   const leftImage = d3.select("#left-image");
   const rightImage = d3.select("#right-image");
   const phone = d3.select("#phone");
   const polaroid = d3.select("#polaroid");
  
   // Calculate saturation based on divider position
   // 0% = divider all the way left (showing only 2021), 100% = divider all the way right (showing only 2011)
  
   // Left image (2011): More visible when divider is to the right
   // When divider is at 100% (all the way right), left image should be black and white
   // When divider is at 0% (all the way left), left image should be colored
   const leftGrayscale = dividerPosition; // 0% = colored, 100% = black and white
   leftImage.style("filter", `grayscale(${leftGrayscale}%)`);
  
   // Right image (2021): More visible when divider is to the left
   // When divider is at 0% (all the way left), right image should be colored (0% grayscale)
   // When divider is at 100% (all the way right), right image should be black and white (100% grayscale)
   const rightGrayscale = dividerPosition; // 0% = colored, 100% = black and white
   rightImage.style("filter", `grayscale(${rightGrayscale}%)`);
  
   // Phone frame should remain stationary - don't clip it
   // Only the images inside screen-content are clipped
  
   // Calculate polaroid clip-path to align with divider position
   // Divider is positioned within screen-content (262px wide, starting at 20px from phone left)
   // Phone and polaroid are both 300px wide
   // Convert divider position to polaroid coordinate system
   const screenContentLeft = 20; // pixels from left edge of phone
   const screenContentWidth = 262; // pixels
   const phoneWidth = 300; // pixels (same as polaroid)
   
   // Calculate divider's absolute position from left edge of phone/polaroid
   const dividerAbsolutePx = screenContentLeft + (dividerPosition / 100) * screenContentWidth;
   // Convert to percentage of phone/polaroid width
   const dividerAbsolutePercent = (dividerAbsolutePx / phoneWidth) * 100;
   
   // Polaroid shows left side up to divider position
   // Clip from right: show 0% to dividerAbsolutePercent%
   polaroid.style("clip-path", `inset(0 ${100 - dividerAbsolutePercent}% 0 0)`);
  
   // Keep polaroid vertical (no rotation)
   polaroid.style("transform", `rotate(0deg)`);
}


function setInitialPosition() {
   const leftContainer = d3.select("#left-image-container");
   const rightContainer = d3.select("#right-image-container");
   const divider = d3.select("#divider");
   const phone = d3.select("#phone");
   const polaroid = d3.select("#polaroid");
  
   // Set initial position at 50%
   const initialPosition = 50;
  
   // Set initial clip paths for images
   leftContainer.style("clip-path", `inset(0 ${100 - initialPosition}% 0 0)`);
   rightContainer.style("clip-path", `inset(0 0 0 ${initialPosition}%)`);
  
   // Phone frame should remain stationary - don't clip it
   // Only the images inside screen-content are clipped
   
   // Calculate polaroid clip-path to align with divider position (same calculation as updateColorSaturation)
   const screenContentLeft = 20; // pixels from left edge of phone
   const screenContentWidth = 262; // pixels
   const phoneWidth = 300; // pixels (same as polaroid)
   
   const dividerAbsolutePx = screenContentLeft + (initialPosition / 100) * screenContentWidth;
   const dividerAbsolutePercent = (dividerAbsolutePx / phoneWidth) * 100;
   
   polaroid.style("clip-path", `inset(0 ${100 - dividerAbsolutePercent}% 0 0)`);
  
   divider.style("left", initialPosition + "%");
  
   // Set initial divider height
   updateDividerHeight(initialPosition);
  
   // Set initial color saturation
   updateColorSaturation(initialPosition);
}


// Add some interactive enhancements
function addPhoneInteractions() {
   const phone = d3.select("#phone");
  
   // Add realistic hover effect for iPhone 17
   phone.on("mouseenter", function() {
       d3.select(this).transition()
           .duration(300)
           .style("transform", "scale(1.02) rotateX(2deg) rotateY(2deg)")
           .style("filter", "none");
   })
   .on("mouseleave", function() {
       d3.select(this).transition()
           .duration(300)
           .style("transform", "scale(1) rotateX(0deg) rotateY(0deg)")
           .style("filter", "none");
   });
  
   // Add arrow button navigation for neighborhood changes
   addArrowNavigation();
}


// Add arrow navigation for neighborhood changes
function addArrowNavigation() {
   const phoneContainer = d3.select("#phone-container");
  
   // Create up arrow button with Blue Jays logo (rotated 90deg clockwise)
   const upArrow = phoneContainer.append("div")
       .attr("id", "up-arrow")
       .style("position", "absolute")
       .style("top", "-40px")
       .style("left", "50%")
       .style("transform", "translateX(-50%)")
       .style("width", "40px")
       .style("height", "40px")
       .style("background", "rgba(255,255,255,0.9)")
       .style("border-radius", "50%")
       .style("display", "flex")
       .style("align-items", "center")
       .style("justify-content", "center")
       .style("cursor", "pointer")
       .style("z-index", "15")
       .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
       .style("transition", "all 0.3s ease");
   
   upArrow.append("img")
       .attr("src", "data/blue jays icon.png")
       .attr("alt", "Blue Jays Logo")
       .style("width", "36px")
       .style("height", "36px")
       .style("object-fit", "contain")
       .style("transform", "rotate(90deg)");
  
   // Create down arrow button with Blue Jays logo (rotated 90deg counterclockwise)
   const downArrow = phoneContainer.append("div")
       .attr("id", "down-arrow")
       .style("position", "absolute")
       .style("bottom", "-40px")
       .style("left", "50%")
       .style("transform", "translateX(-50%)")
       .style("width", "40px")
       .style("height", "40px")
       .style("background", "rgba(255,255,255,0.9)")
       .style("border-radius", "50%")
       .style("display", "flex")
       .style("align-items", "center")
       .style("justify-content", "center")
       .style("cursor", "pointer")
       .style("z-index", "15")
       .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
       .style("transition", "all 0.3s ease");
   
   downArrow.append("img")
       .attr("src", "data/blue jays icon.png")
       .attr("alt", "Blue Jays Logo")
       .style("width", "36px")
       .style("height", "36px")
       .style("object-fit", "contain")
       .style("transform", "rotate(-90deg)");
  
   // Add hover effects
   upArrow.on("mouseenter", function() {
       d3.select(this)
           .style("background", "rgba(255,255,255,1)")
           .style("transform", "translateX(-50%) scale(1.1)")
           .style("box-shadow", "0 6px 16px rgba(0,0,0,0.4)");
   })
   .on("mouseleave", function() {
       d3.select(this)
           .style("background", "rgba(255,255,255,0.9)")
           .style("transform", "translateX(-50%) scale(1)")
           .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)");
   });
  
   downArrow.on("mouseenter", function() {
       d3.select(this)
           .style("background", "rgba(255,255,255,1)")
           .style("transform", "translateX(-50%) scale(1.1)")
           .style("box-shadow", "0 6px 16px rgba(0,0,0,0.4)");
   })
   .on("mouseleave", function() {
       d3.select(this)
           .style("background", "rgba(255,255,255,0.9)")
           .style("transform", "translateX(-50%) scale(1)")
           .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)");
   });
  
   // Add click events
   upArrow.on("click", function() {
       changeNeighborhood(-1); // Previous neighborhood
   });
  
   downArrow.on("click", function() {
       changeNeighborhood(1); // Next neighborhood
   });
}


// Change neighborhood based on swipe direction
function changeNeighborhood(direction) {
   console.log("Changing neighborhood, direction:", direction);
  
   if (!appData || !appData.neighbourhoods) return;
  
   const currentIndex = appData.neighbourhoods.findIndex(d => d.name === currentNeighborhood?.name);
   const totalOptions = appData.neighbourhoods.length;
  
   let newIndex = currentIndex + direction;
  
   // Wrap around
   if (newIndex < 0) {
       newIndex = totalOptions - 1;
   } else if (newIndex >= totalOptions) {
       newIndex = 0;
   }
  
   console.log("Changing from index", currentIndex, "to", newIndex);
  
   // Update the neighborhood
   currentNeighborhood = appData.neighbourhoods[newIndex];
   updateYearDropdown();
   updateDisplay();
  
   // Visual feedback removed - phone no longer compresses/inflates on arrow click
}


// Initialize phone interactions when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
   addPhoneInteractions();
});


// Add keyboard navigation
document.addEventListener("keydown", function(event) {
   if (!currentNeighborhood) return;
  
   const availableYears = currentNeighborhood.photos.map(photo => photo.year).sort();
   const currentIndex = availableYears.indexOf(currentYear);
  
   if (event.key === "ArrowLeft" && currentIndex > 0) {
       const newYear = availableYears[currentIndex - 1];
       currentYear = newYear;
       updateDisplay();
   } else if (event.key === "ArrowRight" && currentIndex < availableYears.length - 1) {
       const newYear = availableYears[currentIndex + 1];
       currentYear = newYear;
       updateDisplay();
   }
});


// Add touch gestures for mobile
let touchStartX = 0;
let touchEndX = 0;


document.addEventListener("touchstart", function(event) {
   touchStartX = event.changedTouches[0].screenX;
});


document.addEventListener("touchend", function(event) {
   touchEndX = event.changedTouches[0].screenX;
   handleSwipe();
});


function handleSwipe() {
   const swipeThreshold = 50;
   const diff = touchStartX - touchEndX;
  
   if (!currentNeighborhood) return;
  
   const availableYears = currentNeighborhood.photos.map(photo => photo.year).sort();
   const currentIndex = availableYears.indexOf(currentYear);
  
   if (Math.abs(diff) > swipeThreshold) {
       if (diff > 0 && currentIndex < availableYears.length - 1) {
           // Swipe left - next year
           const newYear = availableYears[currentIndex + 1];
           currentYear = newYear;
           updateDisplay();
       } else if (diff < 0 && currentIndex > 0) {
           // Swipe right - previous year
           const newYear = availableYears[currentIndex - 1];
           currentYear = newYear;
           updateDisplay();
       }
   }
}


function adjustLabelFontSize(textSelector, labelSelector, baseFontSize) {
   const textElement = d3.select(textSelector).node();
   const labelElement = d3.select(labelSelector).node();
   
   if (!textElement || !labelElement) return;
   
   // Reset to base font size
   const label = d3.select(labelSelector);
   label.style("font-size", baseFontSize + "rem");
   
   // Wait for DOM to update
   setTimeout(() => {
       // Max height should be a bit shorter than image height (600px) - use 550px
       const maxHeight = 550;
       
       // Since labels are rotated, measure the width (which becomes the visual height)
       let currentFontSize = baseFontSize;
       let textWidth = textElement.scrollWidth || textElement.offsetWidth;
       
       // Decrease font size until it fits
       while (textWidth > maxHeight && currentFontSize > 0.4) {
           currentFontSize -= 0.05;
           label.style("font-size", currentFontSize + "rem");
           // Force reflow to get updated measurements
           void textElement.offsetWidth;
           textWidth = textElement.scrollWidth || textElement.offsetWidth;
       }
   }, 50);
}












