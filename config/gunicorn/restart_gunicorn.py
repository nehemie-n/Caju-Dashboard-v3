import subprocess

config_file = "prod.py"
pid_command = f'cat {config_file} | grep pidfile | cut -d "=" -f 2'
pid = subprocess.run(
    pid_command, shell=True, capture_output=True, text=True
).stdout.strip()
restart_command = f"kill -HUP {pid}"
subprocess.run(restart_command, shell=True)
