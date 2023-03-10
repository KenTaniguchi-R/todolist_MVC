//console.log("hello world")

/*
  client side
    template: static template
    logic(js): MVC(model, view, controller): used to server side technology, single page application
        model: prepare/manage data,
        view: manage view(DOM),
        controller: business logic, event bindind/handling

  server side
    json-server
    CRUD: create(post), read(get), update(put, patch), delete(delete)


*/

//read
/* fetch("http://localhost:3000/todos")
    .then((res) => res.json())
    .then((data) => {
        console.log(data);
    }); */


function myFetch(url, options={}){
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method || 'GET', url);
        if (options.body) xhr.setRequestHeader(...Object.entries(options.headers)[0]);
        xhr.responseType = 'json';
        xhr.onload = () => {
            resolve(xhr.response);
        }
        xhr.onerror = () => {
            reject(xhr.statusText);
        }
        xhr.send(options.body);
    });
}



const APIs = (() => {
    const createTodo = (newTodo) => {
        return myFetch("http://localhost:3000/todos", {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        })
    };

    const deleteTodo = (id) => {
        return myFetch("http://localhost:3000/todos/" + id, {
            method: "DELETE",
        })
    };

    const getTodos = () => {
        return myFetch("http://localhost:3000/todos")
    };

    const updateTodo = (id, updatedTodo) => {
        return myFetch("http://localhost:3000/todos/" + id, {
            method: "PATCH",
            body: JSON.stringify(updatedTodo),
            headers: { "Content-Type": "application/json" },
        })
    };
    return { createTodo, deleteTodo, getTodos, updateTodo };
})();

//IIFE
//todos
/*
    hashMap: faster to search
    array: easier to iterate, has order
*/
const Model = (() => {
    class State {
        #todos; //private field
        #onChange; //function, will be called when setter function todos is called
        constructor() {
            this.#todos = [];
        }
        get todos() {
            return this.#todos;
        }
        set todos(newTodos) {
            this.#todos = newTodos;
            this.#onChange?.(); // rendering
        }

        subscribe(callback) {
            //subscribe to the change of the state todos
            this.#onChange = callback;
        }
    }
    const { getTodos, createTodo, deleteTodo, updateTodo } = APIs;
    return {
        State,
        getTodos,
        createTodo,
        deleteTodo,
        updateTodo,
    };
})();
/*
    todos = [
        {
            id:1,
            content:"eat lunch",
            completed:false
        },
        {
            id:2,
            content:"eat breakfast",
            completed:true
        }
    ]

*/
const View = (() => {
    const todoPendingListEl = document.querySelector(".pending-list");
    const todoCompletedListEl = document.querySelector(".completed-list");

    const submitBtnEl = document.querySelector(".submit-btn");
    const inputEl = document.querySelector(".input");

    const renderTodos = (todos) => {
        let pendingTemplates = "";
        let completedTemplates = "";
        let pending_count = 0;
        let completed_count = 0;

        const pending_list = todos.filter((todo) => !todo.completed)
        const completed_list = todos.filter((todo) => todo.completed)

        completed_list.sort(function(a,b){
            return new Date(b.completed_time) - new Date(a.completed_time);
        });

        const new_todos = [...pending_list, ...completed_list]

        new_todos.forEach((todo) => {
            const liTemplate = `
            <li>
                ${todo.completed ? `<button class="complete-btn" completed data-id="${todo.id}">
                    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
                </button>` : ""}
                <span class="content">${todo.content}</span>
                <input type="text" class="edit-input" data-id="${todo.id}" value="${todo.content}" style="display: none;">
                <button class="edit-btn" data-id="${todo.id}">
                    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"  aria-label="fontSize small"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                </button>
                <button class="delete-btn" data-id="${todo.id}">
                    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                </button>
                ${todo.completed ? "" : `<button class="complete-btn" pending data-id="${todo.id}">
                    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowForwardIcon" aria-label="fontSize small"><path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>
                </button>`}
            </li>`;

            if (todo.completed) {
                completedTemplates += liTemplate;
                completed_count += 1;
            } else {
                pendingTemplates += liTemplate;
                pending_count += 1;
            }
        });
        if (pending_count.length === 0) {
            pendingTemplates = "<h4>no task to display!</h4>";
        }
        if (completed_count.length === 0) {
            completedTemplates = "<h4>no task to display!</h4>";
        }
        todoPendingListEl.innerHTML = pendingTemplates;
        todoCompletedListEl.innerHTML = completedTemplates;

    };

    const clearInput = () => {
        inputEl.value = "";
    };

    return { renderTodos, submitBtnEl, inputEl, clearInput, todoPendingListEl, todoCompletedListEl };
})();

const Controller = ((view, model) => {
    const state = new model.State();
    const init = () => {
        model.getTodos().then((todos) => {
            todos.reverse();
            state.todos = todos;
        });
    };

    const handleSubmit = () => {
        view.submitBtnEl.addEventListener("click", (event) => {
            /*
                1. read the value from input
                2. post request
                3. update view
            */
            const inputValue = view.inputEl.value;
            model.createTodo({ content: inputValue, completed: false }).then((data) => {
                state.todos = [data, ...state.todos];
                view.clearInput();
            });
        });
    };

    const handleDelete = () => {
        //event bubbling
        /*
            1. get id
            2. make delete request
            3. update view, remove
        */

        function deleteTodo(event){
            if (event.target.className === "delete-btn") {
                const id = event.target.getAttribute("data-id");
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id);
                });
            }
        }
        view.todoPendingListEl.addEventListener("click", deleteTodo);
        view.todoCompletedListEl.addEventListener("click", deleteTodo);
    };

    const handleEdit = () => {

        function editTodo(event){
            if (event.target.className === "edit-btn") {
                const content = event.target.parentElement.querySelector(".content");
                const editInput = event.target.parentElement.querySelector(".edit-input");
                if (event.target.hasAttribute("editing")) {
                    const id = event.target.getAttribute("data-id");
                    model.updateTodo(+id, {content: editInput.value}).then((data) => {
                        state.todos = state.todos.filter((todo) => {
                            if (todo.id === +id) todo.content = editInput.value;
                            return todo;
                        });
                        event.target.removeAttribute("editing");
                        editInput.style.display = "none";
                        content.style.display = "block";
                    });
                } else {
                    event.target.setAttribute("editing", '');
                    editInput.style.display = "block";
                    content.style.display = "none";
                }
            }
        }
        view.todoPendingListEl.addEventListener("click", editTodo);
        view.todoCompletedListEl.addEventListener("click", editTodo);
    };

    const handleComplete = () => {

        function updateComplete(event) {
            if (event.target.className === "complete-btn") {
                const id = event.target.getAttribute("data-id");
                const data = {
                    completed: !event.target.hasAttribute("completed"),
                    completed_time: new Date().toISOString(),
                }
                model.updateTodo(+id, data ).then((data) => {
                    state.todos = state.todos.filter((todo) => {
                        if (todo.id === +id) {
                            todo.completed = !todo.completed;
                            todo.completed_time = data.completed_time;
                        };
                        return todo;
                    });

                });
            }
        }
        view.todoPendingListEl.addEventListener("click", updateComplete);
        view.todoCompletedListEl.addEventListener("click", updateComplete);
    };

    const bootstrap = () => {
        init();
        handleSubmit();
        handleDelete();
        handleEdit();
        handleComplete();
        state.subscribe(() => {
            view.renderTodos(state.todos);
        });
    };
    return {
        bootstrap,
    };
})(View, Model); //ViewModel

Controller.bootstrap();
