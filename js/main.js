// iPhone Time Stories - D3 Interactive Visualization
let appData = null;
let currentNeighborhood = null;
let currentYear = null;


// // Initialize the application
// d3.json("data/place_data.json").then(data => {
//     appData = data;
//     initializeApp();
// });


// // --- FIXED DROPDOWN INITIALIZATION (using 2021 data jsons) ---
// function initializeApp() {
//     const neighborhoodSelect = d3.select("#neighborhood-select");

//     // we just need to choose one ot make dropdown cuz should be same stuffs
//     const neighborhoods = data2021.map(d => d.neighbourhood);

//     neighborhoodSelect
//         .selectAll("option")
//         .data(neighborhoods)
//         .enter()
//         .append("option")
//         .attr("value", d => d)
//         .text(d => d);

//     // Event listener for dropdown
//     neighborhoodSelect.on("change", function() {
//         const selectedNeighborhood = this.value;
//         if (selectedNeighborhood) {
//             currentNeighborhood = selectedNeighborhood;
//             updateDisplay();
//         }
//     });

//     // default
//     setTimeout(() => {
//         d3.select("#neighborhood-select").property("value", "Yonge-Bay Corridor");
//         d3.select("#neighborhood-select").dispatch("change");
//     }, 100);
// }

// Promise.all([
//     d3.json("cleaned_data/2011_cleaned_data_i_cry.json"),
//     d3.json("cleaned_data/2021_cleaned_data_i_cry.json")
// ]).then(([d2011, d2021]) => {
//     data2011 = d2011;
//     data2021 = d2021;
//     initializeApp(); // int dropdown after data is ready
// });



// function initializeApp() {
//     // Populate neighborhood dropdown
//     const neighborhoodSelect = d3.select("#neighborhood-select");
//     const neighborhoods = appData.neighbourhoods.map(d => d.name);
    
//     neighborhoodSelect
//         .selectAll("option")
//         .data(neighborhoods)
//         .enter()
//         .append("option")
//         .attr("value", d => d)
//         .text(d => d);


//     // Set up event listeners
//     d3.select("#neighborhood-select")
//         .on("change", function() {
//             const selectedNeighborhood = this.value;
//             if (selectedNeighborhood) {
//                 currentNeighborhood = appData.neighbourhoods.find(d => d.name === selectedNeighborhood);
//                 updateDisplay();
//             }
//         });


//     // Set default selection to High Park for testing
//     setTimeout(() => {
//         d3.select("#neighborhood-select").property("value", "High Park");
//         d3.select("#neighborhood-select").dispatch("change");
//     }, 100);
// }


// function updateDisplay() {
//     if (!currentNeighborhood) return;


//     // Load both images for split-screen comparison
//     const photos = currentNeighborhood.photos.sort((a, b) => a.year - b.year);
//     const leftPhoto = photos[0]; // Earlier year (2011)
//     const rightPhoto = photos[1]; // Later year (2021)
    
//     if (leftPhoto && rightPhoto) {
//         // Load left image (2011)
//         loadImage("#left-image", leftPhoto.url);
        
//         // Load right image (2021)
//         loadImage("#right-image", rightPhoto.url);
        
//         // Load polaroid image (2011)
//         loadImage("#polaroid-image", leftPhoto.url);
        
//         // Update overlay information
//         d3.select("#location-name").text(currentNeighborhood.name);
//         d3.select("#location-year").text("Then vs. Now");
        
//         // Update polaroid caption
//         d3.select("#polaroid-text").text(`${leftPhoto.year} • ${currentNeighborhood.name}`);
        
//         // Initialize drag functionality
//         initializeDrag();
        
//         // Set initial divider position and clip paths
//         setInitialPosition();
//     }
// }


// helper: map for renamed neighbourhoods between years  (cua 2011 and 2021 fronts are diff)
const nameMap2011to2021 = {
    "Waterfront Communities-The Island": "Harbourfront-CityPlace",
    "High Park-Swansea": "High Park-Swansea",
    "Casa Loma": "Casa Loma",
    "Kensington-Chinatown": "Kensington-Chinatown",
    "Moss Park": "Moss Park",
    "South Riverdale": "South Riverdale",
    "Trinity-Bellwoods": "Trinity-Bellwoods",
    "Bay Street Corridor": "Yonge-Bay Corridor"
};

// helper: get matching 2011 name given a 2021 neighbourhood 
function getMatching2011Name(name2021) {
    // const match = Object.entries(nameMap2011to2021).find(([oldName, newName]) => newName === name2021);
    // return match ? match[0] : name2021; // default same name
    for (const [oldName, newName] of Object.entries(nameMap2011to2021)) {
        if (newName === name2021) return oldName;
    }
    return name2021;


}

// loading datesets
let data2011 = null;
let data2021 = null;

Promise.all([
    d3.json("cleaned_data/2011_cleaned_data_i_cry.json"),
    d3.json("cleaned_data/2021_cleaned_data_i_cry.json")
]).then(([d2011, d2021]) => {
    data2011 = d2011;
    data2021 = d2021;
    console.log("Loaded datasets");
    initializeApp();
});


// init dropdown
function initializeApp() {
    const neighborhoodSelect = d3.select("#neighborhood-select");
    const neighborhoods = data2021.map(d => d.neighbourhood);

    neighborhoodSelect
        .selectAll("option")
        .data(neighborhoods)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    neighborhoodSelect.on("change", function() {
        const selectedNeighborhood = this.value;
        if (selectedNeighborhood) {
            currentNeighborhood = selectedNeighborhood;
            updateDisplay();
        }
    });

    // defauly so we have city hall;
    setTimeout(() => {
        d3.select("#neighborhood-select").property("value", "Yonge-Bay Corridor");
        d3.select("#neighborhood-select").dispatch("change");
    }, 100);
}


// then vs now picture comparison
function updateDisplay() {
    if (!currentNeighborhood || !data2011 || !data2021) return;

    const year2021Name = currentNeighborhood;
    const year2011Name = getMatching2011Name(year2021Name);

    const oldData = data2011.find(d => d.neighbourhood === year2011Name);
    const newData = data2021.find(d => d.neighbourhood === year2021Name);

    // catches if missing data
    if (!oldData || !newData) {
        console.warn("MISSING data for:", year2011Name, year2021Name);
        return;
    }

     // --- Photos ---
    const leftPhoto = {
        year: 2011,
        url: oldData.landmark || "images/default_2011.jpg"
    };
    const rightPhoto = {
        year: 2021,
        url: newData.landmark || "images/default_2021.jpg"
    };


    // Load photos into existing elements
    loadImage("#left-image", leftPhoto.url);
    loadImage("#right-image", rightPhoto.url);
    loadImage("#polaroid-image", leftPhoto.url);

    // Update captions
    d3.select("#location-name").text(year2021Name);
    d3.select("#location-year").text("Then vs. Now");
    d3.select("#polaroid-text").text(`${leftPhoto.year} • ${year2011Name}`);

    // Reset slider and transitions
    setInitialPosition();
    initializeDrag();

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

//  The helper functions initializedDrag(), pdateDividerHeight, and updateColorSaturation are 
//  used to ehlp make smooth transition
function initializeDrag() {
    const divider = d3.select("#divider");
    const leftContainer = d3.select("#left-image-container");
    const rightContainer = d3.select("#right-image-container");
    const screenContent = d3.select("#screen-content");
    
    let isDragging = false;
    let startX = 0;
    let startDividerPosition = 50; // Start in middle
    
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
        
        // Constrain between 0% and 100%
        const constrainedPosition = Math.max(0, Math.min(100, newDividerPosition));
        
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
        
        // Constrain between 0% and 100%
        const constrainedPosition = Math.max(0, Math.min(100, newDividerPosition));
        
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
    
    // Phone always shows on the right side of the divider
    phone.style("clip-path", `inset(0 0 0 ${dividerPosition}%)`);
    
    // Polaroid always shows on the left side of the divider
    polaroid.style("clip-path", `inset(0 ${100 - dividerPosition}% 0 0)`);
    
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
    
    // Set initial clip paths for phone and polaroid
    phone.style("clip-path", `inset(0 0 0 ${initialPosition}%)`);
    polaroid.style("clip-path", `inset(0 ${100 - initialPosition}% 0 0)`);
    
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
            .style("filter", "drop-shadow(0 20px 50px rgba(0,0,0,0.5)) drop-shadow(0 8px 20px rgba(0,0,0,0.3))");
    })
    .on("mouseleave", function() {
        d3.select(this).transition()
            .duration(300)
            .style("transform", "scale(1) rotateX(0deg) rotateY(0deg)")
            .style("filter", "drop-shadow(0 15px 40px rgba(0,0,0,0.4)) drop-shadow(0 5px 15px rgba(0,0,0,0.2))");
    });
    
    // Add arrow button navigation for neighborhood changes
    addArrowNavigation();
}


// Add arrow navigation for neighborhood changes (the top and botton buttons)
function addArrowNavigation() {
    const phoneContainer = d3.select("#phone-container");
    
    // Create up arrow button
    const upArrow = phoneContainer.append("div")
        .attr("id", "up-arrow")
        .style("position", "absolute")
        .style("top", "-60px")
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
        .style("transition", "all 0.3s ease")
        .html("↑")
        .style("font-size", "20px")
        .style("color", "#333")
        .style("font-weight", "bold");
    
    // Create down arrow button
    const downArrow = phoneContainer.append("div")
        .attr("id", "down-arrow")
        .style("position", "absolute")
        .style("bottom", "-60px")
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
        .style("transition", "all 0.3s ease")
        .html("↓")
        .style("font-size", "20px")
        .style("color", "#333")
        .style("font-weight", "bold");
    
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
    
    const neighborhoodSelect = d3.select("#neighborhood-select");
    const currentIndex = neighborhoodSelect.property("selectedIndex");
    const options = neighborhoodSelect.selectAll("option").nodes();
    const totalOptions = options.length;
    
    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) {
        newIndex = totalOptions - 1;
    } else if (newIndex >= totalOptions) {
        newIndex = 0;
    }
    
    console.log("Changing from index", currentIndex, "to", newIndex);
    
    // Update the select and trigger change
    neighborhoodSelect.property("selectedIndex", newIndex);
    neighborhoodSelect.dispatch("change");
    
    // Add visual feedback
    const phone = d3.select("#phone");
    phone.style("transform", "scale(1.05)");
    setTimeout(() => {
        phone.style("transform", "scale(1)");
    }, 200);
}

// the right and left circles
function addNavigationCircles() {
    const phoneContainer = d3.select("#phone-container");

    // ---- LEFT SIDE (2011) ----
    const categoriesLeft = [
        { name: "Housing", icon: "icons/housing_2011.jpeg" },
        { name: "Transportation", icon: "icons/transportation_2011.png" },
        { name: "Labour", icon: "icons/labour_2011.png" },
        { name: "Demographic", icon: "icons/demographic_2011.webp" }
    ];

    const leftCircles = phoneContainer.append("div")
        .attr("id", "left-circles")
        .style("position", "absolute")
        .style("left", "180px")
        .style("top", "50%")
        .style("transform", "translateY(-50%)")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("gap", "50px")
        .style("z-index", "20");

    categoriesLeft.forEach(cat => {
        const circle = leftCircles.append("div")
            .attr("class", "nav-circle")
            .style("width", "60px")
            .style("height", "60px")
            .style("border-radius", "50%")
            .style("background", "rgba(255,255,255,0.95)")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .on("mouseenter", function() {
                d3.select(this)
                    .style("background", "white")
                    .style("transform", "scale(1.1)")
                    .style("box-shadow", "0 6px 16px rgba(0,0,0,0.4)");
            })
            .on("mouseleave", function() {
                d3.select(this)
                    .style("background", "rgba(255,255,255,0.95)")
                    .style("transform", "scale(1)")
                    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)");
            })
            .on("click", function(event) {
                toggleModal(cat.name, event.target, "left");
            });

        circle.append("img")
            .attr("src", cat.icon)
            .attr("alt", cat.name)
            .style("width", "32px")
            .style("height", "32px")
            .style("object-fit", "contain")
            .style("pointer-events", "none");
    });

    // ---- RIGHT SIDE (2021) ----
    const categoriesRight = [
        { name: "Housing", icon: "icons/housing_2021.avif" },
        { name: "Transportation", icon: "icons/transportation_2021.png" },
        { name: "Labour", icon: "icons/labour_2021.jpg" },
        { name: "Demographic", icon: "icons/demographic_2021.png" }
    ];

    const rightCircles = phoneContainer.append("div")
        .attr("id", "right-circles")
        .style("position", "absolute")
        .style("right", "180px")
        .style("top", "50%")
        .style("transform", "translateY(-50%)")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("gap", "50px")
        .style("z-index", "20");

    categoriesRight.forEach(cat => {
        const circle = rightCircles.append("div")
            .attr("class", "nav-circle")
            .style("width", "60px")
            .style("height", "60px")
            .style("border-radius", "50%")
            .style("background", "rgba(255,255,255,0.95)")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .on("mouseenter", function() {
                d3.select(this)
                    .style("background", "white")
                    .style("transform", "scale(1.1)")
                    .style("box-shadow", "0 6px 16px rgba(0,0,0,0.4)");
            })
            .on("mouseleave", function() {
                d3.select(this)
                    .style("background", "rgba(255,255,255,0.95)")
                    .style("transform", "scale(1)")
                    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)");
            })
            .on("click", function(event) {
                toggleModal(cat.name, event.target, "right");
            });

        circle.append("img")
            .attr("src", cat.icon)
            .attr("alt", cat.name)
            .style("width", "32px")
            .style("height", "32px")
            .style("object-fit", "contain")
            .style("pointer-events", "none");
    });
}




// Information Modal ====================
function toggleModal(category, circleElement, side) {
    const existing = document.querySelector(`.info-modal[data-category="${category}"][data-side="${side}"]`);
    if (existing) {
        existing.remove();
        return;
    }

    const year2021Name = currentNeighborhood;
    const year2011Name = getMatching2011Name(year2021Name);

    const dataSet = side === "left"
        ? data2011.find(d => d.neighbourhood === year2011Name)
        : data2021.find(d => d.neighbourhood === year2021Name);

    const yearLabel = side === "left" ? "2011" : "2021";
    if (!dataSet) return;

    const content = getCategoryContent(dataSet, category);

    const modal = document.createElement("div");
    modal.className = "info-modal";
    modal.dataset.category = category;
    modal.dataset.side = side;
    modal.innerHTML = `
        <div class="info-modal-header">
            <div class="info-modal-title">${category} (${yearLabel})</div>
            <button class="info-modal-close">✕</button>
        </div>
        <div class="info-modal-body">${content}</div>
    `;

    document.body.appendChild(modal);

    // Position beside the clicked circle
    const rect = circleElement.getBoundingClientRect();
    const modalWidth = 240;
    const offset = 16;
    const top = rect.top + window.scrollY - 10;

    modal.style.position = "absolute";
    modal.style.top = `${top}px`;
    modal.style.zIndex = "999";

    if (side === "left") {
        modal.style.left = `${rect.left - modalWidth - offset}px`;
    } else {
        modal.style.left = `${rect.right + offset}px`;
    }

    modal.querySelector(".info-modal-close").addEventListener("click", () => modal.remove());
}


// Formatting information on the div
function getCategoryContent(data, category) {
    const h = data.housing || {};
    const t = data.transportation || {};
    const l = data.labour || {};
    const d = data.demographic || {};

    switch (category) {
        // Emojis used for clarity
        case "Housing":
            return `
                <p>🏠 <b>Owner:</b> ${h["%_owner"] ?? "N/A"}%</p>
                <p>🏢 <b>Renter:</b> ${h["%_renter"] ?? "N/A"}%</p>
                <p>💰 <b>Avg. Value:</b> $${h["average_value_of_dwelling"]?.toLocaleString() ?? "N/A"}</p>
            `;
        case "Transportation":
            return `
                <p>🚌 <b>Top Mode:</b> ${t["top_mode_of_transportation"] ?? "N/A"}</p>
                <p>⏱️ <b>Median Duration:</b> ${t["median_commuting_duration"] ?? "N/A"} min</p>
            `;
        case "Labour":
            return `
                <p>💼 <b>Top Industries:</b></p>
                ${(l.top_3_industries || [])
                    .map(i => `<p>- ${Object.keys(i)[0]}: ${Object.values(i)[0]}%</p>`)
                    .join("")}
            `;
        case "Demographic":
            return `
                <p>👶 <b>Top Age Groups:</b></p>
                ${(d.top_3_age_groups || [])
                    .map(a => `<p>- ${Object.keys(a)[0]}: ${Object.values(a)[0]}%</p>`)
                    .join("")}
            `;
        default:
            return "<p>No data available.</p>";
    }
}

// Initialize phone interactions when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    addPhoneInteractions();
    addNavigationCircles();
});


// Add keyboard navigation (removed year-specific navigation)
document.addEventListener("keydown", function(event) {
    if (!currentNeighborhood) return;
    
    // You can add other keyboard shortcuts here if needed
});


// Add touch gestures for mobile (removed year-specific gestures)
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
    }