import { createSlice } from "@reduxjs/toolkit";
export const spinnerSlice = createSlice({
    name: "spinner",
    initialState: {
        show: true
    },
    reducers: {
        enableSpinner: (state) => {
            state.show = true;
        },
        disableSpinner: (state) => {
            state.show = false;
        }
    }
});

export const { enableSpinner, disableSpinner } = spinnerSlice.actions;

export default spinnerSlice.reducer;