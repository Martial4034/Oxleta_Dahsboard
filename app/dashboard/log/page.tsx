"use client";

import { useState } from "react";

const logsData = [
  {
    id: "1",
    userId: "test1@example.com",
    action: "Image Uploaded",
    timestamp: new Date(Date.now() - 3600000).toLocaleString(), // 1 hour ago
  },
  {
    id: "2",
    userId: "test1@example.com",
    action: "Image Deleted",
    timestamp: new Date(Date.now() - 7200000).toLocaleString(), // 2 hours ago
  },
];

const actionOptions = ["Image Uploaded", "Image Deleted"];

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [filteredLogs, setFilteredLogs] = useState(logsData);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredLogs(
      logsData.filter(
        (log) =>
          log.userId.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query)
      )
    );
  };

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    setFilteredLogs(logsData.filter((log) => log.action === action));
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="mb-4 text-3xl font-bold text-center">User Logs</h1>
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Search by User ID or Action"
          value={searchQuery}
          onChange={handleSearch}
          className="w-full px-4 py-2 border rounded-md"
        />
        <div className="ml-2">
          <select
            value={selectedAction}
            onChange={(e) => handleActionSelect(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">Select Action</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 text-center border-b">User ID</th>
              <th className="px-4 py-2 text-center border-b">Action</th>
              <th className="px-4 py-2 text-center border-b">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-100">
                <td className="px-4 py-2 text-center border-b">{log.userId}</td>
                <td className="px-4 py-2 text-center border-b">{log.action}</td>
                <td className="px-4 py-2 text-center border-b">
                  {log.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination (simple example) */}
      <div className="flex justify-center mt-4">
        <button className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Previous
        </button>
        <button className="px-4 py-2 ml-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Next
        </button>
      </div>
    </div>
  );
}
