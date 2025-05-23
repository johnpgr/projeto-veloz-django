# This is a monorepo with a Django REST Framework backend, a Next.js frontend, and a PostgreSQL database. Use best practices for Docker, Django, Next.js, and PostgreSQL integration.

## Instructions

In the current version of Next.js `cookies()` returns a Promise however you can still reference the properties of the underlying cookies object
synchronously to facilitate migration. The `UnsafeUnwrappedCookies` type is added to your code by a codemod that attempts to automatically
updates callsites to reflect the new Promise return type. There are some cases where `cookies()` cannot be automatically converted, namely
when it is used inside a synchronous function and we can't be sure the function can be made async automatically. In these cases we add an
explicit type case to `UnsafeUnwrappedCookies` to enable typescript to allow for the synchronous usage only where it is actually necessary.

You should should update these callsites to either be async functions where the `cookies()` value can be awaited or you should call `cookies()`
from outside and await the return value before passing it into this function.

You can find instances that require manual migration by searching for `UnsafeUnwrappedCookies` in your codebase or by search for a comment that
starts with `@next-codemod-error`.

In a future version of Next.js `cookies()` will only return a Promise and you will not be able to access the underlying cookies object directly
without awaiting the return value first. When this change happens the type `UnsafeUnwrappedCookies` will be updated to reflect that is it no longer
usable.