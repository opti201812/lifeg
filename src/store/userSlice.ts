import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
   id: number;
   name: string;
}

interface UserState {
   users: User[];
   currentUser: User | null;
   isAuthenticated: boolean;
}

const initialState: UserState = {
   users: [],
   currentUser: null,
   isAuthenticated: false,
};

const userSlice = createSlice({
   name: "user",
   initialState,
   reducers: {
      setUsers: (state, action: PayloadAction<User[]>) => {
         state.users = action.payload;
      },
      setCurrentUser: (state, action: PayloadAction<User>) => {
         state.currentUser = action.payload;
         state.isAuthenticated = true;
      },
      addUser: (state, action: PayloadAction<User>) => {
         state.users.push(action.payload);
      },
      removeUser: (state, action: PayloadAction<number>) => {
         state.users = state.users.filter((user) => user.id !== action.payload);
      },
      logout: (state) => {
         state.currentUser = null;
         state.isAuthenticated = false;
      },
   },
});

export const { setUsers, setCurrentUser, addUser, removeUser, logout } = userSlice.actions;
export default userSlice.reducer;
