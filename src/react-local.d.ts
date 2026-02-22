declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}

declare module 'react' {
  export type ReactNode =
    | string
    | number
    | boolean
    | null
    | undefined
    | ReactElement
    | ReactNode[];

  export interface ReactElement {
    type: unknown;
    props: unknown;
    key: string | number | null;
  }

  export type PropsWithChildren<P = Record<string, unknown>> = P & {
    children?: ReactNode;
  };

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
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: never[]) => unknown>(callback: T, deps: readonly unknown[]): T;
  export function useRef<T>(initialValue: T): { current: T };

  export function useReducer<S, A>(
    reducer: (prevState: S, action: A) => S,
    initialState: S
  ): [S, Dispatch<A>];

  export interface Context<T> {
    Provider: (props: PropsWithChildren<{ value: T }>) => ReactElement;
  }

  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;

  export const StrictMode: (props: PropsWithChildren) => ReactElement;
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react';

  export function createRoot(container: Element | DocumentFragment): {
    render(children: ReactNode): void;
  };
}

declare module 'react/jsx-runtime' {
  import type { ReactElement } from 'react';

  export const Fragment: unique symbol;
  export function jsx(type: unknown, props: unknown, key?: string): ReactElement;
  export function jsxs(type: unknown, props: unknown, key?: string): ReactElement;
}
