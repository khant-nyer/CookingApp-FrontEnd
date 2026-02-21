declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react' {
  export type ReactNode = any;
  export interface PropsWithChildren<P = unknown> extends P {
    children?: ReactNode;
  }

  export interface SyntheticEvent<T = Element> {
    preventDefault(): void;
    target: T;
    currentTarget: T;
  }

  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {}
  export interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  export interface KeyboardEvent<T = Element> extends SyntheticEvent<T> {
    key: string;
  }

  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;

  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useReducer<R extends (state: any, action: any) => any, I>(
    reducer: R,
    initialArg: I
  ): [ReturnType<R>, Dispatch<Parameters<R>[1]>];

  export interface Context<T> { Provider: any; _value?: T }
  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;

  export const StrictMode: any;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: any): void;
  };
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}
