import React, { Component } from "react";
import { FaPlus } from "react-icons/fa";
import "./App.css";

class App extends Component {
  state = {
    method: "GET",
    lastRequest: "",
    id: "",
    title: "",
    order: "",
    status: 0,
    response: [],
    showModal: false,
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    let { method, id, title, order, status } = this.state;

    let request = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Undefined ensures not changing to empty string.
    const body = {
      title: title ? title : undefined,
      order: order ? Number(order) : undefined,
      status,
    };

    if (method !== "GET") request.body = JSON.stringify(body);

    this.setState({ lastRequest: `${method} at /${id}` });
    // Code smells, but the setup of todo-backend with get('/') returning a list of todos requires
    // that we directly hit localhost instead of being able to rely on the proxy.
    // We can only proxy non-root gets.
    let response;
    if (
      process.env.NODE_ENV === "development" &&
      method === "GET" &&
      id === ""
    ) {
      response = await fetch("http://localhost:5000/", request);
    } else {
      response = await fetch(`/${id}`, request);
    }

    const contentType = response.headers.get("content-type");

    let bodyResponse;
    if (contentType && contentType.includes("application/json")) {
      bodyResponse = await response.json();
    } else if (contentType && contentType.includes("text/html")) {
      bodyResponse = await response.text();
    }

    if (response.status !== 200) {
      console.log(bodyResponse);
      this.setState({
        response: [{ status: response.status, message: bodyResponse }],
      });
      return;
    }

    // Ensures format of [{}, {}, {}]
    if (!Array.isArray(bodyResponse)) bodyResponse = Array(bodyResponse);

    this.setState({ response: bodyResponse, showModal: false });
  };
  changeMethod = (event) => {
    this.setState({ method: event.target.value });
  };

  toggleModal = () => {
    this.setState((prevState) => ({
      showModal: !prevState.showModal,
    }));
  };

  render() {
    const {
      method,
      lastRequest,
      id,
      title,
      order,
      status,
      response,
      showModal,
    } = this.state;

    // const columns = [
    //   { status: 0, label: "To-do" },
    //   { status: 1, label: "Doing" },
    //   { status: 2, label: "Done" },
    // ];
    // const shouldDisplayModalCreate = method === "POST" || method === "PATCH";

    return (
      <div className="App min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-semibold">Todo Dashboard</h2>
            <button
              onClick={this.toggleModal}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
            >
              <FaPlus className="inline mr-2" /> Create To-Do
            </button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-3 gap-6">
            {/* To-Do Column */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">To-Do</h3>
              {response
                .filter((todo) => todo.status === 0)
                .map((todo, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 p-3 mb-3 rounded-md shadow-sm"
                  >
                    <h4 className="font-semibold">{todo.title}</h4>
                    <p>Order: {todo.order}</p>
                  </div>
                ))}
            </div>

            {/* Doing Column */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Doing</h3>
              {response
                .filter((todo) => todo.status === 1)
                .map((todo, i) => (
                  <div
                    key={i}
                    className="bg-yellow-200 p-3 mb-3 rounded-md shadow-sm"
                  >
                    <h4 className="font-semibold">{todo.title}</h4>
                    <p>Order: {todo.order}</p>
                  </div>
                ))}
            </div>

            {/* Done Column */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Done</h3>
              {response
                .filter((todo) => todo.status === 2)
                .map((todo, i) => (
                  <div
                    key={i}
                    className="bg-green-200 p-3 mb-3 rounded-md shadow-sm"
                  >
                    <h4 className="font-semibold">{todo.title}</h4>
                    <p>Order: {todo.order}</p>
                  </div>
                ))}
            </div>
          </div>

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
        </div>
      </div>
    );
  }
}

export default App;
