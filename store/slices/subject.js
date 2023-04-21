import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
    subjects: [],
    loading: false,
    error: null
};

export const getSubjects = createAsyncThunk('subject/all', async (id) => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/all/${id}`)
    return data;
})

export const deleteSubject = createAsyncThunk('subject/delete', async (id) => {
    const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/${id}`)
    return data;
})

const subjectSlice = createSlice({
    name: 'subject',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(getSubjects.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getSubjects.fulfilled, (state, action) => {
            state.loading = false;
            state.subjects = action.payload;
        });
        builder.addCase(getSubjects.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        });
    }
});

export const selectSubjects = (state) => state.subject?.subjects;

export default subjectSlice.reducer;