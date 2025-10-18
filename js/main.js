// NOTE: HARVEST OR CHERRY BLOSSOM SEASON COULD BE ANOTHER IDEA

d3.json("data/place_data.json").then(data => {
    // dropdown
    const neighbourhoods = data.neighbourhoods.map(d => d.name);
    
    // Get selected neighbourhood
    const selected = data.neighbourhoods.find(d => d.name === "Waterfront Communities-The Island");

});


