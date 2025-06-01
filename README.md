# SmzUiWorkspace

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Prompt

I'm using the Playground project to explorer some ideas to be implemented in my smz-store library.

After polish all the store architecture I will move the code to the library and leave only the client demo code on the playground.

The Store will have main 3 features: Resource Store, Global Store, Feature Store.

1. Resource Store: this store represents the readonly that that the application will be consuming as resource. This Store is injected globally in the application and can be consumed anytime. The Resource store . For example, a list of something to be used in a dropdown list, or a schema list, or any entity list that doesn't change much.

2. Global Store,
