import { createContext, useContext } from 'react';

/**
 * Whether Learn Mode is on. Lives in its own module so the components that
 * read it stay fast-refreshable.
 */
export const LearnModeContext = createContext(false);

export const useLearnMode = () => useContext(LearnModeContext);
