import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
    subjects: [],
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null
};

export const getSubjects = createAsyncThunk('subject/all', async ({ id, page, search }) => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/all/${id}?page=${page}&search=${search}`)
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
            state.currentPage = action.payload.currentPage;
            state.totalPages = action.payload.numberOfPages;
        });
        builder.addCase(getSubjects.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        });
    }
});

export const selectSubjects = (state) => state.subject.subjects;
export const selectLoadingState = (state) => state.subject.loading;
export const selectCurrentPage = (state) => state.subject.currentPage;
export const selectTotalPages = (state) => state.subject.totalPages;

export default subjectSlice.reducer;