# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/admin.spec.ts >> admin >> [flow] create a user and find them in user management
- Location: tests/flows/admin.spec.ts:5:7

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
        - list [ref=e56]:
          - link "Site Settings" [ref=e58] [cursor=pointer]:
            - /url: /admin/site-settings
          - link "Users" [ref=e66] [cursor=pointer]:
            - /url: /admin/manage/users
          - link "Households" [ref=e74] [cursor=pointer]:
            - /url: /admin/manage/households
          - link "Groups" [ref=e82] [cursor=pointer]:
            - /url: /admin/manage/groups
          - link "Backups" [ref=e90] [cursor=pointer]:
            - /url: /admin/backups
        - separator [ref=e97]
        - list [ref=e98]:
          - link "Maintenance" [ref=e100] [cursor=pointer]:
            - /url: /admin/maintenance
          - listitem [ref=e109] [cursor=pointer]:
            - generic [ref=e114]: Debug
      - list [ref=e121]:
        - listitem [ref=e122] [cursor=pointer]:
          - status "Badge" [ref=e129]: "1"
          - generic [ref=e130]: Announcements
        - listitem [ref=e132] [cursor=pointer]:
          - generic [ref=e137]: Settings
    - main [ref=e139]:
      - generic [ref=e141]:
        - generic [ref=e142]:
          - generic [ref=e143]: User Management
          - separator [ref=e144]
        - generic [ref=e145]:
          - generic [ref=e147]:
            - link "Create" [ref=e148] [cursor=pointer]:
              - /url: /admin/manage/users/create
            - button "Invite" [ref=e153] [cursor=pointer]
            - button "Actions" [ref=e158] [cursor=pointer]
          - table [ref=e165]:
            - rowgroup [ref=e166]:
              - row [ref=e167]:
                - columnheader "User ID" [ref=e168]
                - columnheader "Username" [ref=e171]
                - columnheader "Full Name" [ref=e174]
                - columnheader "Email" [ref=e177]
                - columnheader "Group" [ref=e180]
                - columnheader "Household" [ref=e183]
                - columnheader "Auth Method" [ref=e186]
                - columnheader "Admin" [ref=e189]
                - columnheader "Delete" [ref=e192]
            - rowgroup [ref=e195]:
              - row [ref=e196] [cursor=pointer]:
                - cell "8490d4de-4045-490b-9f55-1286f1d0efee" [ref=e197]
                - cell "e2eflowmv7jwkcm73" [ref=e198]
                - cell "E2E Flow mv7jwkcm73" [ref=e199]
                - cell "e2e-flow-mv7jwkcm73@example.com" [ref=e200]
                - cell "Home" [ref=e201]
                - cell "Family" [ref=e202]
                - cell "Mealie" [ref=e203]
                - cell [ref=e204]
                - cell [ref=e208]:
                  - button [ref=e209]
              - row [ref=e214] [cursor=pointer]:
                - cell "c21ad069-6180-4f2e-bf5a-a942c812f790" [ref=e215]
                - cell "e2eprofile" [ref=e216]
                - cell "E2E Profile User" [ref=e217]
                - cell "e2e-profile@example.com" [ref=e218]
                - cell "Home" [ref=e219]
                - cell "Family" [ref=e220]
                - cell "Mealie" [ref=e221]
                - cell [ref=e222]
                - cell [ref=e226]:
                  - button [ref=e227]
              - row [ref=e232] [cursor=pointer]:
                - cell "b7572f67-cc70-4b00-8d05-ae1217bdb715" [ref=e233]
                - cell "e2emember" [ref=e234]
                - cell "E2E Member" [ref=e235]
                - cell "e2e-member@example.com" [ref=e236]
                - cell "Home" [ref=e237]
                - cell "Family" [ref=e238]
                - cell "Mealie" [ref=e239]
                - cell [ref=e240]
                - cell [ref=e244]:
                  - button [ref=e245]
              - row [ref=e250] [cursor=pointer]:
                - cell "e6c9c5d9-15ff-4b12-a66f-94f9be075880" [ref=e251]
                - cell "e2eadmin" [ref=e252]
                - cell "E2E Admin" [ref=e253]
                - cell "e2e-admin@example.com" [ref=e254]
                - cell "Home" [ref=e255]
                - cell "Family" [ref=e256]
                - cell "Mealie" [ref=e257]
                - cell [ref=e258]
                - cell [ref=e262]:
                  - button [ref=e263]
          - separator [ref=e268]
  - generic:
    - tooltip
```