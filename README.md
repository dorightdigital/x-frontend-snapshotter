## X Frontend Snapshotter
=======

This is a tool to snapshot examples from govuk-frontend, and hopefully other departement frontends too.

### Usageß
----

1. Clone the repo
2. Make sure you're using a recent version of node (tested against `10.15.1`)
3. `npm install`
4. Then you can render examples from `govuk-frontend` `3.4.0` using the command `./generateTestFixtures.sh alphagov/govuk-frontend 3.4.0` or from `hmrc-frontend` `1.6.0` using the command `./generateTestFixtures.sh hmrc/govuk-hmrc 1.6.0`

The output will be save to the `target/processed` directory.

### What's in the output?
----

Each directory inside `target/processed` contains:

`component.json` the name of the component (designed to be read programatically)
`input.json` the parameters given to the component
`output.html` the output generated when the component was rendered with the provided input