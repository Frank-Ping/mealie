# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/auth.spec.ts >> auth >> [flow] log in with valid credentials and land on the recipe list
- Location: tests/flows/auth.spec.ts:8:7

# Error details

```
Test timeout of 45000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e6]:
        - button [ref=e7] [cursor=pointer]
        - link [ref=e12] [cursor=pointer]:
          - /url: /g/home
          - button [ref=e13]
        - generic [ref=e18]: Mealie
        - generic [ref=e23]:
          - textbox "Press '/'" [ref=e31]
          - alert [ref=e32]
        - button "Logout" [ref=e34] [cursor=pointer]
    - navigation [ref=e39]:
      - generic [ref=e40]:
        - link "e6c9c5d9-15ff-4b12-a66f-94f9be075880 E2E Admin Favorite Recipes" [ref=e41] [cursor=pointer]:
          - /url: /user/profile
          - generic [ref=e43]:
            - img "e6c9c5d9-15ff-4b12-a66f-94f9be075880" [ref=e45]:
              - img "e6c9c5d9-15ff-4b12-a66f-94f9be075880" [ref=e46]
            - generic [ref=e47]:
              - generic [ref=e48]: E2E Admin
              - link "Favorite Recipes" [ref=e50]:
                - /url: /user/e6c9c5d9-15ff-4b12-a66f-94f9be075880/favorites
        - separator [ref=e55]
        - button "Create" [ref=e56] [cursor=pointer]
        - list [ref=e61]:
          - link "Recipes" [ref=e63] [cursor=pointer]:
            - /url: /g/home
          - link "Recipe Finder" [ref=e71] [cursor=pointer]:
            - /url: /g/home/recipes/finder
          - link "Meal Planner" [ref=e79] [cursor=pointer]:
            - /url: /household/mealplan/planner/view
          - link "Shopping Lists" [ref=e87] [cursor=pointer]:
            - /url: /shopping-lists
          - link "Timeline" [ref=e95] [cursor=pointer]:
            - /url: /g/home/recipes/timeline
          - link "Cookbooks" [ref=e103] [cursor=pointer]:
            - /url: /g/home/cookbooks
          - listitem [ref=e112] [cursor=pointer]:
            - generic [ref=e117]: Organizers
        - separator [ref=e123]
        - list [ref=e124]:
          - link "E2E Cookbook" [ref=e126] [cursor=pointer]:
            - /url: /g/home/cookbooks/e2e-cookbook
      - list [ref=e134]:
        - listitem [ref=e135] [cursor=pointer]:
          - status "Badge" [ref=e142]: "1"
          - generic [ref=e143]: Announcements
        - listitem [ref=e145] [cursor=pointer]:
          - generic [ref=e150]: Settings
    - main [ref=e152]:
      - generic [ref=e155]:
        - generic [ref=e157]:
          - textbox "Search..." [ref=e167]
          - generic [ref=e168]:
            - button "Categories" [ref=e172] [cursor=pointer]
            - button "Tags" [ref=e180] [cursor=pointer]
            - button "Tools" [ref=e188] [cursor=pointer]
            - button "Foods" [ref=e196] [cursor=pointer]
            - button "Households" [ref=e204] [cursor=pointer]
            - button "Created" [ref=e209] [cursor=pointer]
            - button [ref=e214] [cursor=pointer]
        - separator [ref=e219]
        - generic [ref=e221]:
          - generic [ref=e222]:
            - generic [ref=e226]: Recipes
            - button "Random" [ref=e227] [cursor=pointer]
            - button [ref=e232] [cursor=pointer]
          - generic [ref=e239]:
            - link "E2E Garden Salad E2E Quick ☆ ☆ ☆ ☆ ☆" [ref=e242] [cursor=pointer]:
              - /url: /g/home/r/e2e-garden-salad
              - generic [ref=e247]: E2E Garden Salad
              - generic [ref=e248]:
                - generic [ref=e249]: E2E Quick
                - generic [ref=e252]:
                  - button [ref=e253]
                  - generic [ref=e258]:
                    - generic [ref=e259]: ☆
                    - generic [ref=e260]: ☆
                    - generic [ref=e261]: ☆
                    - generic [ref=e262]: ☆
                    - generic [ref=e263]: ☆
                  - button [ref=e265]
            - link "Fluffy pancakes used by the E2E yardstick. E2E Pancakes E2E Quick ☆ ☆ ☆ ☆ ☆" [ref=e272] [cursor=pointer]:
              - /url: /g/home/r/e2e-pancakes
              - paragraph [ref=e281]: Fluffy pancakes used by the E2E yardstick.
              - generic [ref=e282]: E2E Pancakes
              - generic [ref=e283]:
                - generic [ref=e284]: E2E Quick
                - generic [ref=e287]:
                  - button [ref=e288]
                  - generic [ref=e293]:
                    - generic [ref=e294]: ☆
                    - generic [ref=e295]: ☆
                    - generic [ref=e296]: ☆
                    - generic [ref=e297]: ☆
                    - generic [ref=e298]: ☆
                  - button [ref=e300]
  - generic:
    - tooltip
    - tooltip
    - tooltip "Remove from Favorites"
```