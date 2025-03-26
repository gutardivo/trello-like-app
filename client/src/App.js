import React, { Component } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "./App.css";

class App extends Component {
  state = {
    lastRequest: "",
    id: "",
    title: "",
    order: "",
    status: 0,
    response: [],
    user: "Gustavo",
    showModal: false,
    showDeleteModal: false,
    showEditModal: false,
    todoToEdit: null,
  };

  // Fetch all todos when the component is mounted
  componentDidMount() {
    this.fetchTodos();
  }

  // Function to fetch todos from the backend
  fetchTodos = async () => {
    const request = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    this.setState({ lastRequest: "GET at /" });

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
      console.log(body);
      this.setState({ response: [{ status: response.status, message: body }] });
      return;
    }

    if (!Array.isArray(body)) body = Array(body);
    this.setState({ response: body });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { title, order, status } = this.state;

    console.log(title, order, status);

    const body = {
      title: title || undefined,
      order: order ? Number(order) : undefined,
      status: status ?? 0,
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

      this.setState({ title: "", order: "", status: 0 });
      this.toggleModal();
      this.fetchTodos();
    } catch (error) {
      console.error("Error:", error.message);
      toast.error(error.message);
    }
  };

  toggleModal = () => {
    this.setState((prevState) => ({
      showModal: !prevState.showModal,
    }));
  };

  toggleDeleteModal = () => {
    this.setState({ showDeleteModal: !this.state.showDeleteModal });
  };

  toggleEditModal = (todo) => {
    this.setState({
      showEditModal: !this.state.showEditModal,
      todoToEdit: todo,
    });
  };

  handleDelete = async () => {
    const { todoToDelete } = this.state;
    const todoToDeleteId = todoToDelete.url.split("/")[3];

    if (!todoToDelete || !todoToDeleteId) {
      console.error("Cannot delete: todoToDelete is undefined or has no ID");
      return;
    }

    try {
      const response = await fetch(`/${todoToDeleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("To-do deleted successfully!");
        this.setState({ showDeleteModal: false, todoToDelete: null });
        this.fetchTodos(); // Refresh list after delete
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Could not delete todo:", error);
      toast.error("Failed to delete to-do.");
    }
  };

  handleEditSubmit = async (e) => {
    e.preventDefault();
    const { todoToEdit, status } = this.state;
    const todoToEditId = todoToEdit.url.split("/")[3];

    const response = await fetch(`/${todoToEditId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: todoToEdit.title,
        order: todoToEdit.order,
        status,
      }),
    });

    if (response.status === 200) {
      toast.success("To-do updated successfully!");
      this.fetchTodos(); // Refresh todos after update
      this.setState({ showEditModal: false, todoToEdit: null });
    } else {
      toast.error("Failed to update to-do");
    }
  };

  render() {
    const {
      showModal,
      title,
      order,
      status,
      response,
      user,
      showDeleteModal,
      showEditModal,
      todoToEdit,
    } = this.state;

    const bgColors = ["bg-blue-100", "bg-yellow-100", "bg-green-100"];
    const textColors = ["text-blue-500", "text-yellow-600", "text-green-500"];

    return (
      <div className="App min-h-screen bg-yellow-50/75 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-semibold">{user}'s to-do list</h2>
            <button
              onClick={this.toggleModal}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
            >
              <FaPlus className="inline mr-2" /> Create To-Do
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {["To-Do", "Doing", "Done"].map((statusText, idx) => (
              <div
                key={idx}
                className={bgColors[idx] + " p-4 rounded-lg shadow-md"}
              >
                <h3 className={"text-2xl font-bold mb-4 " + textColors[idx]}>
                  {statusText}
                </h3>
                {response
                  .filter((todo) => todo.status === idx)
                  .map((todo) => (
                    <div
                      key={todo.url}
                      className="bg-white p-3 mb-3 rounded-md shadow-sm cursor-pointer"
                      onClick={() => this.toggleEditModal(todo)}
                    >
                      <h4 className="font-semibold">{todo.title}</h4>
                      <p>Order: {todo.order}</p>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-100">
              <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h3 className="text-2xl mb-4">
                  Are you sure you want to delete?
                </h3>
                <button
                  onClick={() => this.handleDelete(this.state.todoToDelete.id)}
                  className="bg-red-500 text-white p-2 rounded-lg mr-2"
                >
                  Yes
                </button>
                <button
                  onClick={this.toggleDeleteModal}
                  className="bg-gray-500 text-white p-2 rounded-lg"
                >
                  No
                </button>
              </div>
            </div>
          )}

          {/* Edit To-Do Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h3 className="text-2xl mb-4">Edit To-Do</h3>
                <form
                  onSubmit={this.handleEditSubmit}
                  className="flex flex-col space-y-4"
                >
                  <input
                    type="text"
                    placeholder="Title"
                    value={title || todoToEdit.title}
                    onChange={(e) => this.setState({ title: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Order"
                    value={order || todoToEdit.order}
                    onChange={(e) => this.setState({ order: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <select
                    value={status || todoToEdit.status}
                    onChange={(e) => this.setState({ status: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  >
                    <option value="0">To-Do</option>
                    <option value="1">Doing</option>
                    <option value="2">Done</option>
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
                    onClick={this.toggleEditModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      if (todoToEdit) {
                        this.setState({ todoToDelete: todoToEdit }, () => {
                          this.toggleDeleteModal();
                          this.toggleEditModal();
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
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h3 className="text-2xl mb-4">Create To-Do</h3>
                <form
                  onSubmit={this.handleSubmit}
                  className="flex flex-col space-y-4"
                >
                  <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => this.setState({ title: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Order"
                    value={order}
                    onChange={(e) => this.setState({ order: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <select
                    value={status}
                    onChange={(e) => this.setState({ status: e.target.value })}
                    className="p-2 border border-gray-300 rounded"
                  >
                    <option value="0">To-Do</option>
                    <option value="1">Doing</option>
                    <option value="2">Done</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                  >
                    Submit
                  </button>
                </form>
                <button
                  onClick={this.toggleModal}
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
}

export default App;
