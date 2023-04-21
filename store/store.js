import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';

import SubjectReducer from './slices/subject'
import NotesReducer from './slices/Notes'
import spinnerReducer from './slices/Spinner'

const makeStore = () =>
    configureStore({
        reducer: {
            subject: SubjectReducer,
            notes: NotesReducer,
            spinner: spinnerReducer
        },
        devTools: true,
    });

export const wrapper = createWrapper(makeStore);