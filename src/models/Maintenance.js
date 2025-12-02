
const mongoose = require("mongoose");

const MaintenanceSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true }, 
    issue: { type: String, required: true },      
    type: { type: String, default: "Others" },    
    priority: { type: String, default: "Medium" },
    status: { type: String, default: "Open" },    
    reportedBy: { type: String, default: "" },    
    reportedOn: {
      type: String,
      default: function () {
        
        return new Date().toISOString().slice(0, 10);
      },
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Maintenance", MaintenanceSchema);
