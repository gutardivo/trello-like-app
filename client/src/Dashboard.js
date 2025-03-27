import React, { useEffect, useReducer } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import auth from "./lib/firebase";

import "./App.css";

const initialState = {
  lastRequest: "",
  id: "",
  title: "",
  order: "",
  status: 0,
  response: [],
  user: null,
  users: [],
  assignedUsers: [],
  showModal: false,
  showDeleteModal: false,
  showEditModal: false,
  todoToEdit: null,
  todoToDelete: null,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case "SET_LAST_REQUEST":
      return { ...state, lastRequest: action.payload };
    case "SET_ID":
      return { ...state, id: action.payload };
    case "SET_TITLE":
      return { ...state, title: action.payload };
    case "SET_ORDER":
      return { ...state, order: action.payload };
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "SET_RESPONSE":
      return { ...state, response: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_USERS":
      return { ...state, users: action.payload };
    case "SET_SHOW_MODAL":
      return { ...state, showModal: action.payload };
    case "SET_SHOW_DELETE_MODAL":
      return { ...state, showDeleteModal: action.payload };
    case "SET_SHOW_EDIT_MODAL":
      return { ...state, showEditModal: action.payload };
    case "SET_TODO_TO_EDIT":
      return { ...state, todoToEdit: action.payload };
    case "SET_TODO_TO_DELETE":
      return { ...state, todoToDelete: action.payload };
    case "SET_ASSIGNED_USERS":
      return { ...state, assignedUsers: action.payload };
    case "TOGGLE_MODAL":
      return { ...state, showModal: !state.showModal };
    case "TOGGLE_DELETE_MODAL":
      return { ...state, showDeleteModal: !state.showDeleteModal };
    case "TOGGLE_EDIT_MODAL":
      return {
        ...state,
        showEditModal: !state.showEditModal,
        todoToEdit: action.payload,
      };
    case "RESET_FORM":
      return { ...state, title: "", order: "", status: 0 };
    default:
      return state;
  }
};

export default function DashboardPage() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const { displayName, email } = currentUser;
        dispatch({ type: "SET_USER", payload: displayName || email });
      } else {
        dispatch({ type: "SET_USER", payload: null });
        navigate("/login");
      }
    });

    fetchTodos();
    fetchUsers();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line
  }, []);

  const signOutUser = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully signed out!");
    } catch (error) {
      toast.error("Error signing out: " + error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      let response;
      if (process.env.NODE_ENV === "development") {
        response = await fetch("http://localhost:5000/users");
      } else {
        response = await fetch("/users");
      }
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: "SET_USERS", payload: data.allUsers });
      } else {
        toast.error("Failed to fetch users.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error fetching users.");
    }
  };

  const fetchTodos = async () => {
    const request = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    dispatch({ type: "SET_LAST_REQUEST", payload: "GET at /" });

    let response;
    if (process.env.NODE_ENV === "development") {
      response = await fetch("http://localhost:5000/", request);
    } else {
      response = await fetch("/", request);
    }

    const contentType = response.headers.get("content-type");

    let body;
    if (contentType && contentType.includes("application/json")) {
      body = await response.json();
    } else if (contentType && contentType.includes("text/html")) {
      body = await response.text();
    }
    if (response.status !== 200) {
      dispatch({
        type: "SET_RESPONSE",
        payload: [{ status: response.status, message: body }],
      });
      return;
    }

    if (!Array.isArray(body)) body = Array(body);
    dispatch({ type: "SET_RESPONSE", payload: body });
  };

  useEffect(() => {
    // Fetch assigned users when a todo is being edited
    const fetchAssignedUsers = async () => {
      if (state.showEditModal && state.todoToEdit) {
        try {
          const todoId = state.todoToEdit.url.split("/")[3];
          const response = await fetch(`/todos/${todoId}/assignees`); // Replace with your actual endpoint to get assignees for a todo
          if (response.ok) {
            const data = await response.json();

            dispatch({ type: "SET_ASSIGNED_USERS", payload: data.users });
          } else {
            toast.error("Failed to fetch assigned users.");
          }
        } catch (error) {
          console.error("Error fetching assigned users:", error);
          toast.error("Error fetching assigned users.");
        }
      } else {
        dispatch({ type: "SET_ASSIGNED_USERS", payload: [] }); // Clear assigned users when modal is closed or no todo is selected
      }
    };

    fetchAssignedUsers();
  }, [state.showEditModal, state.todoToEdit]);

  const handleAssignUser = async (userId) => {
    if (!state.todoToEdit) return;
    const todoId = state.todoToEdit.url.split("/")[3];
    try {
      const response = await fetch("/assign-todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, todoId }),
      });
      if (response.status === 201) {
        toast.success("User assigned successfully!");

        const newUser = { user_id: userId, todo_id: todoId };
        dispatch({
          type: "SET_ASSIGNED_USERS",
          payload: [...state.assignedUsers, newUser],
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to assign user.");
      }
    } catch (error) {
      console.error("Error assigning user:", error);
      toast.error("Error assigning user.");
    }
  };

  const handleUnassignUser = async (userId) => {
    if (!state.todoToEdit) return;
    const todoId = state.todoToEdit.url.split("/")[3];
    try {
      const response = await fetch(`/delete-assign/${userId}/${todoId}`, {
        method: "DELETE",
      });
      if (response.status === 201) {
        toast.success("User unassigned successfully!");
        dispatch({
          type: "SET_ASSIGNED_USERS",
          payload: state.assignedUsers.filter(
            (assignee) => assignee.user_id !== userId
          ),
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to unassign user.");
      }
    } catch (error) {
      console.error("Error unassigning user:", error);
      toast.error("Error unassigning user.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = {
      title: state.title || undefined,
      order: state.order ? Number(state.order) : undefined,
      status: state.status ?? 0,
    };

    try {
      const response = await fetch(`/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create to-do");
      }

      toast.success("To-do created successfully!");

      dispatch({ type: "RESET_FORM" });
      toggleModal();
      fetchTodos();
    } catch (error) {
      console.error("Error:", error.message);
      toast.error(error.message);
    }
  };

  const toggleModal = () => {
    dispatch({ type: "TOGGLE_MODAL" });
  };

  const toggleDeleteModal = () => {
    dispatch({ type: "TOGGLE_DELETE_MODAL" });
  };

  const toggleEditModal = (todo) => {
    dispatch({ type: "TOGGLE_EDIT_MODAL", payload: todo });
    dispatch({ type: "SET_TITLE", payload: todo?.title || "" });
    dispatch({ type: "SET_ORDER", payload: todo?.order || "" });
    dispatch({ type: "SET_STATUS", payload: todo?.status || 0 });
  };

  const handleDelete = async () => {
    if (!state.todoToDelete || !state.todoToDelete.url) {
      console.error("Cannot delete: todoToDelete is undefined or has no URL");
      return;
    }
    const todoToDeleteId = state.todoToDelete.url.split("/")[3];

    if (!todoToDeleteId) {
      console.error("Cannot delete: todoToDelete has no valid ID in the URL");
      return;
    }

    try {
      const response = await fetch(`/${todoToDeleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("To-do deleted successfully!");
        dispatch({ type: "SET_SHOW_DELETE_MODAL", payload: false });
        dispatch({ type: "SET_TODO_TO_DELETE", payload: null });
        fetchTodos();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Could not delete todo:", error);
      toast.error("Failed to delete to-do.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!state.todoToEdit || !state.todoToEdit.url) {
      console.error("Cannot edit: todoToEdit is undefined or has no URL");
      return;
    }
    const todoToEditId = state.todoToEdit.url.split("/")[3];

    if (!todoToEditId) {
      console.error("Cannot edit: todoToEdit has no valid ID in the URL");
      return;
    }

    const body = {
      title: state.title,
      order: Number(state.order),
      status: Number(state.status),
    };

    try {
      const response = await fetch(`/${todoToEditId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 200) {
        toast.success("To-do updated successfully!");
        fetchTodos();
        dispatch({ type: "SET_SHOW_EDIT_MODAL", payload: false });
        dispatch({ type: "SET_TODO_TO_EDIT", payload: null });
        dispatch({ type: "RESET_FORM" });
      } else {
        toast.error("Failed to update to-do");
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update to-do");
    }
  };

  const bgColors = ["bg-blue-100", "bg-yellow-100", "bg-green-100"];
  const textColors = ["text-blue-500", "text-yellow-600", "text-green-500"];

  return (
    <div className="App min-h-screen bg-yellow-50/75 p-6">
      <div className="max-w-7xl mx-auto min-h-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-semibold">{state.user}'s to-do list</h2>
          <div className="flex w-auto space-x-4">
            <button
              onClick={toggleModal}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
            >
              <FaPlus className="inline mr-2" /> Create To-Do
            </button>
            <button
              onClick={signOutUser}
              className="text-gray-400 p-2 rounded-lg"
            >
              Sign-out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {["To-Do", "Doing", "Done"].map((statusText, idx) => (
            <div
              key={idx}
              className={bgColors[idx] + " p-4 rounded-lg shadow-md min-h-full"}
            >
              <h3 className={"text-2xl font-bold mb-4 " + textColors[idx]}>
                {statusText}
              </h3>
              {state.response
                .filter((todo) => todo.status === idx)
                .sort((a, b) => a.order - b.order)
                .map((todo) => (
                  <div
                    key={todo.url}
                    className="bg-white p-3 mb-3 rounded-md shadow-sm cursor-pointer"
                    onClick={() => toggleEditModal(todo)}
                  >
                    <h4 className="font-semibold">{todo.title}</h4>
                    <p>Order: {todo.order}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Delete Confirmation Modal */}
        {state.showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-100">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
              <h3 className="text-2xl mb-4">
                Are you sure you want to delete?
              </h3>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white p-2 rounded-lg mr-2"
              >
                Yes
              </button>
              <button
                onClick={toggleDeleteModal}
                className="bg-gray-500 text-white p-2 rounded-lg"
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Edit To-Do Modal */}
        {state.showEditModal && state.todoToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
              <h3 className="text-2xl mb-4">Edit To-Do</h3>
              <form
                onSubmit={handleEditSubmit}
                className="flex flex-col space-y-4"
              >
                <input
                  type="text"
                  placeholder="Title"
                  value={state.title}
                  onChange={(e) =>
                    dispatch({ type: "SET_TITLE", payload: e.target.value })
                  }
                  className="p-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  placeholder="Order"
                  value={state.order}
                  onChange={(e) =>
                    dispatch({ type: "SET_ORDER", payload: e.target.value })
                  }
                  className="p-2 border border-gray-300 rounded"
                />
                <select
                  value={state.status}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_STATUS",
                      payload: Number(e.target.value),
                    })
                  }
                  className="p-2 border border-gray-300 rounded"
                >
                  <option value={0}>To-Do</option>
                  <option value={1}>Doing</option>
                  <option value={2}>Done</option>
                </select>
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                >
                  Submit
                </button>
              </form>

              <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">Assign Users</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {state.assignedUsers.map((assignee) => (
                    <span
                      key={assignee.id}
                      className="bg-gray-200 text-gray-700 rounded-full px-2 py-1 text-sm flex items-center"
                    >
                      {state.users.find((user) => user.id === assignee.user_id)
                        ?.name || assignee.user_id}{" "}
                      <button
                        onClick={() => handleUnassignUser(assignee.user_id)}
                        className="ml-1 text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        <FaTrash className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  onChange={(e) => {
                    const selectedUserId = e.target.value;
                    if (
                      selectedUserId &&
                      !state.assignedUsers.some(
                        (au) => au.userId === selectedUserId
                      )
                    ) {
                      handleAssignUser(selectedUserId);
                      e.target.value = ""; // Reset the select
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a user to assign
                  </option>
                  {state.users &&
                    state.users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.id}{" "}
                      </option>
                    ))}
                </select>
              </div>

              {/* Buttons container */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() =>
                    dispatch({ type: "SET_SHOW_EDIT_MODAL", payload: false })
                  }
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    if (state.todoToEdit) {
                      dispatch({
                        type: "SET_TODO_TO_DELETE",
                        payload: state.todoToEdit,
                      });
                      toggleDeleteModal();
                      dispatch({ type: "SET_SHOW_EDIT_MODAL", payload: false });
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash className="inline mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Create To-Do */}
        {state.showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
              <h3 className="text-2xl mb-4">Create To-Do</h3>
              <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={state.title}
                  onChange={(e) =>
                    dispatch({ type: "SET_TITLE", payload: e.target.value })
                  }
                  className="p-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  placeholder="Order"
                  value={state.order}
                  onChange={(e) =>
                    dispatch({ type: "SET_ORDER", payload: e.target.value })
                  }
                  className="p-2 border border-gray-300 rounded"
                />
                <select
                  value={state.status}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_STATUS",
                      payload: Number(e.target.value),
                    })
                  }
                  className="p-2 border border-gray-300 rounded"
                >
                  <option value={0}>To-Do</option>
                  <option value={1}>Doing</option>
                  <option value={2}>Done</option>
                </select>
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                >
                  Submit
                </button>
              </form>

              {/* Buttons container */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => {
                    dispatch({ type: "SET_SHOW_DELETE_MODAL", payload: false });
                    dispatch({ type: "SET_TODO_TO_EDIT", payload: null });
                    dispatch({ type: "SET_TITLE", payload: "" });
                    dispatch({ type: "SET_ORDER", payload: "" });
                    dispatch({
                      type: "SET_STATUS",
                      payload: 0,
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    if (state.todoToEdit) {
                      dispatch({
                        type: "SET_TODO_TO_DELETE",
                        payload: state.todoToEdit,
                      });
                      toggleDeleteModal();
                      dispatch({
                        type: "SET_SHOW_DELETE_MODAL",
                        payload: false,
                      });
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash className="inline mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Create To-Do */}
        {state.showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
              <h3 className="text-2xl mb-4">Create To-Do</h3>
              <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={state.title}
                  onChange={(e) =>
                    dispatch({ type: "SET_TITLE", payload: e.target.value })
                  }
                  className="p-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  placeholder="Order"
                  value={state.order}
                  onChange={(e) =>
                    dispatch({ type: "SET_ORDER", payload: e.target.value })
                  }
                  className="p-2 border border-gray-300 rounded"
                />
                <select
                  value={state.status}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_STATUS",
                      payload: Number(e.target.value),
                    })
                  }
                  className="p-2 border border-gray-300 rounded"
                >
                  <option value={0}>To-Do</option>
                  <option value={1}>Doing</option>
                  <option value={2}>Done</option>
                </select>
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                >
                  Submit
                </button>
              </form>
              <button
                onClick={toggleModal}
                className="mt-4 text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer />
      </div>
    </div>
  );
}
