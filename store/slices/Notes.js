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

export const deleteNotes = createAsyncThunk('notes/delete', async (id) => {
    const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/textnotes/${id}`)
    return data;
})

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        removeNote: (state, action) => {
            state.Notes = state.Notes.filter((note) => note._id !== action.payload)
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getNotes.pending, (state) => {
                state.loading = true;
            })
            .addCase(getNotes.fulfilled, (state, action) => {
                state.loading = false;
                state.Notes = action.payload;
            })
            .addCase(getNotes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
    }
});

export const selectNotes = state => state.notes.Notes
export const selectLoadingState = state => state.notes.loading

export default notesSlice.reducer;
