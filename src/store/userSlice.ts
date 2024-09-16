import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types";

interface UserState {
   users: User[];
   currentUser: User | null;
   isAuthenticated: boolean;
   role: "user" | "admin";
   name: string;
   room_id: number | null;
   gender: string | null;
   age: number | null;
}

const initialState: UserState = {
   users: [],
   currentUser: null,
   isAuthenticated: false,
   role: "user",
   name: "",
   room_id: null,
   gender: null,
   age: null,
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
         state.role = action.payload.role;
         state.name = action.payload.name;
         state.room_id = action.payload.room_id;
         // 假设登录成功后，用户的角色为admin
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
         state.role = "user";
         state.name = "";
      },
   },
});

export const { setUsers, setCurrentUser, addUser, removeUser, logout } = userSlice.actions;
export default userSlice.reducer;
