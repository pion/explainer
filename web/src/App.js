import { Disclosure } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";

const navigation = [{ name: "Explainer", href: "#", current: true }];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function App() {
  const [localDescription, setLocalDescription] = useState("");
  const [remoteDescription, setRemoteDescription] = useState("");

  const [parsedLocalDescription, setParsedLocalDescription] = useState("");
  const [parsedRemoteDescription, setParsedRemoteDescription] = useState("");

  const [parsedOutput, setParsedOutput] = useState({});

  const [wasm, setWasm] = useState(null);

  useEffect(() => {
    (async () => {
      const go = new global.Go();
      await fetch("wasm.wasm")
        .then((resp) => resp.arrayBuffer())
        .then((bytes) =>
          WebAssembly.instantiate(bytes, go.importObject).then(function (obj) {
            let wasmObj = obj.instance;
            go.run(wasmObj);
            setWasm(wasmObj);
          })
        );
    })();
  }, []);

  const parseDescription = () => {
    let memoryOffset;
    let wasmMemory = () => {
      return new Uint8Array(wasm.exports.memory.buffer);
    };

    if (wasm === undefined) {
      return;
    } else if (memoryOffset === undefined) {
      memoryOffset = wasm.exports.getWasmMemoryBufferOffset();
    }

    wasmMemory().set(new TextEncoder().encode(localDescription), memoryOffset);
    console.log(localDescription);
    wasm.exports.SetLocalDescription(localDescription.length);

    wasmMemory().set(new TextEncoder().encode(remoteDescription), memoryOffset);
    wasm.exports.SetRemoteDescription(remoteDescription.length);

    let explainResult = wasm.exports.Explain();

    const output = JSON.parse(
      new TextDecoder().decode(
        wasmMemory().subarray(memoryOffset, memoryOffset + explainResult)
      )
    );

    setParsedOutput(output);
    console.log(output);

    setParsedLocalDescription(
      new TextDecoder().decode(
        wasmMemory().subarray(
          memoryOffset,
          memoryOffset + wasm.exports.GetLocalDescription()
        )
      )
    );
    setParsedRemoteDescription(
      new TextDecoder().decode(
        wasmMemory().subarray(
          memoryOffset,
          memoryOffset + wasm.exports.GetRemoteDescription()
        )
      )
    );
  };

  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-indigo-600">
          {({ open }) => (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="h-24 w-24"
                        src="https://pion.ly/img/pion-logo.svg"
                        alt="Workflow"
                      />
                    </div>
                    <div className="hidden md:block">
                      <div className="ml-10 flex items-baseline space-x-4">
                        {navigation.map((item) => (
                          <a
                            key={item.name}
                            href={item.href}
                            className={classNames(
                              item.current
                                ? "bg-indigo-700 text-white"
                                : "text-white hover:bg-indigo-500 hover:bg-opacity-75",
                              "px-3 py-2 rounded-md text-sm font-medium"
                            )}
                            aria-current={item.current ? "page" : undefined}
                          >
                            {item.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="bg-indigo-600 inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-500 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <MenuIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={classNames(
                        item.current
                          ? "bg-indigo-700 text-white"
                          : "text-white hover:bg-indigo-500 hover:bg-opacity-75",
                        "block px-3 py-2 rounded-md text-base font-medium"
                      )}
                      aria-current={item.current ? "page" : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Peer Connection Explainer
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/** content start  */}

            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <h2 className="text-2xl font-bold tracking-tight text-indigo-600 mb-8">
                Please enter your local and remote description below to get
                started ...
              </h2>
              <div className="flex">
                <div className="w-1/2 p-4">
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Local description
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={4}
                      value={localDescription}
                      onChange={(event) => {
                        setLocalDescription(event.target.value);
                      }}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="w-1/2 p-4">
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Remote description
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={4}
                      value={remoteDescription}
                      onChange={(event) => {
                        setRemoteDescription(event.target.value);
                      }}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="justify-end flex pr-10 pt-4">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  onClick={parseDescription}
                >
                  Parse
                </button>
              </div>
            </div>

            <div className="bg-white mt-4 py-8 px-4 shadow sm:rounded-lg sm:px-10 ">
              <p className="text-3xl pb-4"> Results </p>

              <ul className="pl-8 list-disc">
                <li>
                  <span className="text-2xl"> Errors </span>
                  <ul className="pl-8 list-disc">
                    {parsedOutput?.errors?.map((item) => (
                      <li key={item.message}>{item.message}</li>
                    ))}
                  </ul>
                </li>
                {/* <li>
                  <span className="text-2xl"> Local details </span>
                  <ul className="pl-8 list-disc">
                    {parsedOutput?.localDetails?.map((item) => (
                      <li key={item.message}>{item.message}</li>
                    ))}
                  </ul>
                </li>
                <li>
                  <span className="text-2xl"> Remote details </span>
                  <ul className="pl-8 list-disc">
                    {parsedOutput?.remoteDetails?.map((item) => (
                      <li key={item.message}>{item.message}</li>
                    ))}
                  </ul>
                </li>
                <li>
                  <span className="text-2xl"> Session details </span>
                  <ul className="pl-8 list-disc">
                    {parsedOutput?.sessionDetails?.map((item) => (
                      <li key={item.message}>{item.message}</li>
                    ))}
                  </ul>
                </li> */}
                <li>
                  <span className="text-2xl"> Suggestions </span>
                  <ul className="pl-8 list-disc">
                    {parsedOutput?.suggestions?.map((item) => (
                      <li key={item.message}>{item.message}</li>
                    ))}
                  </ul>
                </li>
                <li>
                  <span className="text-2xl"> Warnings </span>
                  <ul className="pl-8 list-disc">
                    {parsedOutput?.warnings?.map((item) => (
                      <li key={item.message}>{item.message}</li>
                    ))}
                  </ul>
                </li>
              </ul>
            </div>

            <div className="bg-white mt-4 py-8 px-4 shadow sm:rounded-lg sm:px-10 flex">
              <div className="w-1/2 p-4">
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700"
                >
                  Parsed local description
                </label>
                <div className="mt-1">
                  <textarea
                    rows={8}
                    value={parsedLocalDescription}
                    onChange={(event) => {}}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="w-1/2 p-4">
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700"
                >
                  Parsed remote description
                </label>
                <div className="mt-1">
                  <textarea
                    rows={8}
                    value={parsedRemoteDescription}
                    onChange={(event) => {}}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/** content end */}
          </div>
        </main>
      </div>
    </>
  );
}
