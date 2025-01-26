import { spawn } from 'child_process';

function update_average_temp_heatmap() {
    const pythonProcess = spawn('python', ['./src/backend/api/heatmaps/average-temperature.py']);

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
      
    pythonProcess.on('close', (code) => {
        console.log(`Update average temperature heatmap: finished with code ${code}`);
    });
}

function update_current_temp_heatmap() {
    const pythonProcess = spawn('python', ['./src/backend/api/heatmaps/current-temperature.py']);

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

    pythonProcess.on('close', (code) => {
        console.log(`Update current temperature heatmap: finished with code ${code}`);
    });
}

function update_average_occupancy_heatmap() {
    const pythonProcess = spawn('python', ['./src/backend/api/heatmaps/average-occupancy.py']);

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

    pythonProcess.on('close', (code) => {
        console.log(`Update average occupancy heatmap: finished with code ${code}`);
    });
}

export { update_average_temp_heatmap, update_current_temp_heatmap, update_average_occupancy_heatmap };