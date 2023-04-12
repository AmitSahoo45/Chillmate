import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
    Notes: [],
    loading: false,
    error: null
};

export const getNotes = createAsyncThunk('notes/all', async (id) => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/${id}`)
    return data;
})

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {},
    extraReducers: {
        [getNotes.pending]: (state, action) => {
            state.loading = true;
        },
        [getNotes.fulfilled]: (state, action) => {
            state.loading = false;
            state.Notes = action.payload;
        },
        [getNotes.rejected]: (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        }
    }
});

export const selectNotes = state => {
    return {
        TextNotes: state.notes.Notes,
        loading: state.notes.loading,
        error: state.notes.error
    }
}


export default notesSlice.reducer;
