# SmzUiWorkspace

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.0.

## References

- [AnalogJS](https://analogjs.org/)
- [Using a schematic generator](https://analogjs.org/docs/features/testing/vitest#using-a-schematicgenerator)


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

### Posts CRUD Demo

A simple feature demonstrating CRUD actions with a `GenericFeatureStore` is available under the `posts-crud` route.

The store is built using `FeatureStoreBuilder` and the `withAction()` helper to attach async actions:

```ts
export const postsCrudStoreProvider = new FeatureStoreBuilder<{ posts: Post[] }>()
  .withInitialState({ posts: [] })
  .withLoaderFn(async (api: PostApiService) => ({ posts: await api.getPosts() }))
  .addDependency(PostApiService)
  .withAction('createPost', (store: PostsCrudStore, api: PostApiService) => async (post: Omit<Post, 'id'>) => {
    const created = await api.createPost(post);
    store.updateState({ posts: [...store.state().posts, created] });
  })
  .withAction('updatePost', (store: PostsCrudStore, api: PostApiService) => async (post: Post) => {
    const updated = await api.updatePost(post);
    store.updateState({
      posts: store.state().posts.map((p) => (p.id === updated.id ? updated : p)),
    });
  })
  .withAction('deletePost', (store: PostsCrudStore, api: PostApiService) => async (id: number) => {
    await api.deletePost(id);
    store.updateState({ posts: store.state().posts.filter((p) => p.id !== id) });
  })
  .buildProvider(POSTS_CRUD_STORE_TOKEN);
```

### Albums CRUD Demo

The `albums-crud` route showcases another simple CRUD using `GenericFeatureStore`.
It follows the same pattern as the posts demo but manages albums retrieved from
`https://jsonplaceholder.typicode.com/albums`.
