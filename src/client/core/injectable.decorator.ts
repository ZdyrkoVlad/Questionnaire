/**
 * Angular-style @Injectable() decorator and DI container
 */

type Constructor<T = any> = new (...args: any[]) => T;

const serviceRegistry = new Map<Constructor, any>();

export interface InjectableOptions {
  providedIn?: 'root';
}

export function Injectable(options: InjectableOptions = { providedIn: 'root' }) {
  return function (target: Constructor) {
    // Registered for DI
    return target;
  };
}

export function inject<T>(serviceClass: Constructor<T>): T {
  if (!serviceRegistry.has(serviceClass)) {
    serviceRegistry.set(serviceClass, new serviceClass());
  }
  return serviceRegistry.get(serviceClass);
}
