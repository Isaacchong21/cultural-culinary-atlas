// src/data/restaurants.js
export const restaurants = [
  {
    country: "Malaysia",
    coords: [110.36, 1.55],
    dishes: [
      {
        id: 1,
        name: "Nasi Lemak",
        description: "Traditional Malaysian coconut rice dish.",
        image: "",
        ingredients: [
          { amount: "2 cups", item: "coconut rice" },
          { amount: "1 tbsp", item: "sambal chili paste" },
          { amount: "50g", item: "fried anchovies" },
          { amount: "30g", item: "roasted peanuts" },
          { amount: "1", item: "boiled egg" }
        ],
        steps: [
          "Cook rice with coconut milk.",
          "Prepare sambal chili paste.",
          "Fry anchovies until crispy.",
          "Serve rice with sambal, anchovies, peanuts, and boiled egg."
        ]
      },
      {
        id: 2,
        name: "Laksa",
        description: "Spicy noodle soup with coconut milk.",
        image: "",
        ingredients: [
          { amount: "200g", item: "rice noodles" },
          { amount: "100ml", item: "coconut milk" },
          { amount: "50g", item: "shrimp" },
          { amount: "1 tbsp", item: "laksa paste" }
        ],
        steps: [
          "Boil Bihun until soft.",
          "Prepare broth with coconut milk and laksa paste.",
          "Add shrimp and cook until done.",
          "Serve noodles with broth and toppings."
        ]
      }
    ]
  },
  {
    country: "Japan",
    coords: [139.69, 35.68],
    dishes: [
      {
        id: 3,
        name: "Sushi",
        description: "Japanese vinegared rice with seafood.",
        image: "",
        ingredients: [
          { amount: "2 cups", item: "sushi rice" },
          { amount: "200g", item: "raw fish" },
          { amount: "1 sheet", item: "nori seaweed" }
        ],
        steps: [
          "Cook sushi rice with vinegar.",
          "Slice raw fish.",
          "Roll rice and fish with nori."
        ]
      }
    ]
  }
];
