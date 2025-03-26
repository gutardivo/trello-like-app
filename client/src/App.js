import React, { Component } from "react";

import logo from "./logo.svg";

import "./App.css";

class App extends Component {
  state = {
    method: "GET",
    lastRequest: "",

    id: "",
    title: "",
    order: "",
    statusTodo: 0,

    response: [],
  };

  handleSubmit = async (e) => {
    let { method, id, title, order, statusTodo } = this.state;

    let request = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Undefined ensures not changing to empty string.
    title = title ? title : undefined;
    order = order ? Number(order) : undefined;

    if (method !== "GET")
      request.body = JSON.stringify({ title, order, status });

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

    // Ensures formart of [{}, {}, {}]
    if (!Array.isArray(body)) body = Array(body);

    this.setState({ response: body });
  };

  changeMethod = (event) => {
    this.setState({ method: event.target.value });
  };

  render() {
    const { method, lastRequest, id, title, order, completed, response } =
      this.state;

    const shouldDisplayIdInput = method !== "POST";
    const shouldDisplayModalCreate = method === "POST" || method === "PATCH";
    const shouldDisplayOrderInput = method === "POST" || method === "PATCH";
    const shouldDisplayCompletedInput = method === "PATCH";

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Powered by React</p>
        </header>

        <form onSubmit={this.handleSubmit}>
          <p>
            <h3>Send to Server:</h3>
          </p>
          <button
            onClick={() => {
              this.setState({ method: "POST" });
            }}
          >
            Create to-do
          </button>
          {shouldDisplayModalCreate && (
            <div className="bg-white rounded-md absolute top-0 left-0 right-0 bottom-0 w-1/2 h-1/3">
              <input
                type="text"
                placeholder="title (string)"
                value={title}
                onChange={(e) => this.setState({ title: e.target.value })}
              />
              <input
                type="text"
                placeholder="order (int)"
                value={order}
                onChange={(e) => this.setState({ order: e.target.value })}
              />
            </div>
          )}
          {/* <select value={method} onChange={this.changeMethod}>
            <option value="GET">Get</option>
            <option value="POST">Post</option>
            <option value="PATCH">Patch</option>
            <option value="DELETE">Delete</option>
          </select> */}
          <input
            type="text"
            placeholder="id (int)"
            value={id}
            onChange={(e) => this.setState({ id: e.target.value })}
          />

          <select
            display="inline-block"
            type="checkbox"
            value={statusTodo}
            onChange={(e) => this.setState({ statusTodo: e.target.value })}
          >
            <option value="0">To-do</option>
            <option value="1">Doing</option>
            <option value="2">Done</option>
          </select>

          <button type="submit">Submit</button>
        </form>
        <h3>{`Last sent: ${lastRequest}`}</h3>
        <p>
          {response.map((todo, i) => {
            return (
              <li key={i}>
                {todo
                  ? Object.entries(todo).map(([key, value]) => {
                      return `${key}: ${value}   `;
                    })
                  : undefined}
              </li>
            );
          })}
        </p>
      </div>
    );
  }
}

export default App;
