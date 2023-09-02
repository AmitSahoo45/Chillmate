import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

const initialState = {
    ErrorSheet: [],
    AccessControll: [],
    currentPage: 1,
    numberOfPages: 0,
    loading: false,
    error: null
}

export const getErrorSheets = createAsyncThunk('errorsheet/all', async ({ id, page, searchBy, searchText }) => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/errorsheet/all/${id}?page=${page}&searchBy=${searchBy}&searchText=${searchText}`)
    console.log(data)
    return data;
});

export const addNewErrorDocument = createAsyncThunk('errorsheet/add', async (formdata) => {
    const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/errorsheet/create`, formdata)
    return data;
});

export const deleteErrorDocument = createAsyncThunk('errorsheet/delete', async ({ errorid, page, userid }) => {
    const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/errorsheet/${errorid}?page=${page}&userid=${userid}`)
    return data;
});

export const updateErrorDocument = createAsyncThunk('errorsheet/update', async (formdata) => {
    const { data } = await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/errorsheet/${formdata.sheetid}`, formdata)
    return data;
});

const errorSheetSlice = createSlice({
    name: 'errorsheet',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // for getting error sheets 
            .addCase(getErrorSheets.pending, (state) => {
                state.loading = true;
            })
            .addCase(getErrorSheets.fulfilled, (state, action) => {
                state.loading = false;
                state.ErrorSheet = action.payload.errorsheets;
                state.currentPage = action.payload.currentPage;
                state.numberOfPages = action.payload.numberOfPages
            })
            .addCase(getErrorSheets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // for adding new error sheet
            .addCase(addNewErrorDocument.pending, (state) => {
                state.loading = true;
            })
            .addCase(addNewErrorDocument.fulfilled, (state, action) => {
                state.loading = false;
                if (state.ErrorSheet.length == 9) {
                    state.ErrorSheet.pop();
                    state.ErrorSheet.unshift(action.payload.errorsheet);
                } else
                    state.ErrorSheet.unshift(action.payload.errorsheet);
            })
            .addCase(addNewErrorDocument.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // for deleting error sheet
            .addCase(deleteErrorDocument.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteErrorDocument.fulfilled, (state, action) => {
                state.loading = false;

                state.ErrorSheet = action.payload?.errorsheets;
                state.currentPage = action.payload?.currentPage;
                state.numberOfPages = action.payload?.numberOfPages
            })
            .addCase(deleteErrorDocument.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // for updating error sheet
            .addCase(updateErrorDocument.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateErrorDocument.fulfilled, (state, action) => {
                state.loading = false;
                // find the sheet in the errorsheet array using the action.payload.errorsheet._id
                // and replace it with the action.payload.errorsheet
                const index = state.ErrorSheet.findIndex((sheet) => sheet._id === action.payload.errorsheet._id);
                state.ErrorSheet[index] = action.payload.errorsheet;
            })
            .addCase(updateErrorDocument.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                toast.error(action.error.message);
            })
    }
});

export const selectErrorSheet = state => { return state.errorsheet.ErrorSheet }
export const selectCurrentPage = state => { return state.errorsheet.currentPage }
export const selectNumberOfPages = state => { return state.errorsheet.numberOfPages }
export const selectError = state => { return state.errorsheet.error }

export default errorSheetSlice.reducer;