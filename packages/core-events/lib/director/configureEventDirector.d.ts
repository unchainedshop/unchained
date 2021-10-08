import { EventDirector } from 'unchained-core-types';
export declare type ContextNormalizerFunction = (context: any) => any;
export declare const defaultNormalizer: ContextNormalizerFunction;
export declare const configureEventDirector: (Events: any) => EventDirector;
