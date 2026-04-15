// Linux Admin / System Management shortcuts (ids 420–455)
// All steps use 'shell', 'user-input', 'set-var', 'confirm-dialog', 'notification', 'show-result', 'clipboard-write'
// — action types that are fully implemented in workflow.js
import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`adminShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. MONITORING (420–424)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 420,
    name: 'Server Health Check',
    icon: 'activity',
    color: 'bg-green',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Gather Health Metrics',
        command: [
          'echo "=== UPTIME & LOAD ==="',
          'uptime',
          'echo ""',
          'echo "=== CPU CORES ==="',
          'nproc && lscpu | grep "Model name" | sed "s/.*: *//"',
          'echo ""',
          'echo "=== MEMORY ==="',
          'free -h',
          'echo ""',
          'echo "=== DISK USAGE ==="',
          'df -h --output=target,size,used,avail,pcent | column -t',
          'echo ""',
          'echo "=== TOP 5 CPU PROCESSES ==="',
          'ps aux --sort=-%cpu | awk "NR==1 || NR<=6" | awk \'{printf "%-8s %-6s %-5s %-5s %s\\n",$1,$2,$3,$4,$11}\'',
        ].join(' && '),
      }),
      step('show-result', { title: 'Health Report', label: 'Full Health Report' }),
    ],
  },

  {
    id: 421,
    name: 'Recent System Errors',
    icon: 'alert-circle',
    color: 'bg-red',
    category: 'admin',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'How many lines?',
        label: 'Number of error lines to show:',
        placeholder: '50',
        prefill: '50',
      }),
      step('set-var', { varName: 'lineCount' }),
      step('shell', {
        title: 'Fetch System Errors',
        command: 'journalctl -p err..emerg -n "{{vars.lineCount}}" --no-pager --output=short 2>/dev/null || grep -i "error\\|failed\\|critical" /var/log/syslog 2>/dev/null | tail -"{{vars.lineCount}}" || echo "No error log accessible"',
      }),
      step('show-result', { title: 'Error Logs', label: 'Recent System Errors' }),
    ],
  },

  {
    id: 422,
    name: 'Top Processes (CPU & RAM)',
    icon: 'zap',
    color: 'bg-orange',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'Top by CPU',
        command: 'echo "=== TOP 10 BY CPU ===" && ps aux --sort=-%cpu | awk \'NR==1{print} NR>1 && NR<=11{printf "%-10s %-6s %6s %6s %s\\n",$1,$2,$3,$4,$11}\' && echo "" && echo "=== TOP 10 BY MEMORY ===" && ps aux --sort=-%mem | awk \'NR==1{print} NR>1 && NR<=11{printf "%-10s %-6s %6s %6s %s\\n",$1,$2,$3,$4,$11}\'',
      }),
      step('show-result', { title: 'Top Processes', label: 'CPU & RAM Leaders' }),
    ],
  },

  {
    id: 423,
    name: 'Who Is Logged In',
    icon: 'users',
    color: 'bg-blue',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'Active Sessions',
        command: 'echo "=== CURRENT USERS ===" && who -a 2>/dev/null && echo "" && echo "=== LAST 10 LOGINS ===" && last -n 10 --time-format iso 2>/dev/null | head -12',
      }),
      step('show-result', { title: 'Logged-In Users', label: 'Active Sessions & Login History' }),
    ],
  },

  {
    id: 424,
    name: 'Disk Usage Alert',
    icon: 'hard-drive',
    color: 'bg-yellow',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Check All Filesystems',
        command: 'echo "=== FILESYSTEMS ABOVE 80% ===" && df -h --output=target,pcent | awk \'NR>1{sub(/%/,"",$2); if($2+0>=80) print $1 " — " $2 "% full"}\' || echo "All filesystems OK (<80%)." && echo "" && echo "=== TOP 10 LARGEST DIRECTORIES IN / ===" && du -sh /[a-z]* 2>/dev/null | sort -rh | head -10',
      }),
      step('show-result', { title: 'Disk Alert', label: 'Disk Usage Report' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. SERVICES & PROCESSES (425–427)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 425,
    name: 'Service Status',
    icon: 'power',
    color: 'bg-cyan',
    category: 'admin',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Service Name',
        label: 'systemd service name:',
        placeholder: 'nginx',
      }),
      step('set-var', { varName: 'svcName' }),
      step('shell', {
        title: 'Check Service',
        command: 'sudo systemctl status "{{vars.svcName}}" --no-pager -l 2>&1 | head -30',
      }),
      step('show-result', { title: 'Service Status', label: '{{vars.svcName}} status' }),
    ],
  },

  {
    id: 426,
    name: 'Restart / Stop / Start Service',
    icon: 'refresh-cw',
    color: 'bg-purple',
    category: 'admin',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Service Name',
        label: 'systemd service to control:',
        placeholder: 'nginx',
      }),
      step('set-var', { varName: 'svcName' }),
      step('user-input', {
        title: 'Action',
        label: 'Action (start / stop / restart / reload / enable / disable):',
        placeholder: 'restart',
        prefill: 'restart',
      }),
      step('set-var', { varName: 'svcAction' }),
      step('confirm-dialog', {
        title: 'Confirm',
        message: 'Run: sudo systemctl {{vars.svcAction}} {{vars.svcName}}?',
      }),
      step('shell', {
        title: 'Running Action...',
        command: 'sudo systemctl "{{vars.svcAction}}" "{{vars.svcName}}" && echo "Done: {{vars.svcAction}} {{vars.svcName}}" && sudo systemctl is-active "{{vars.svcName}}"',
      }),
      step('notification', { title: 'Service Control', body: '{{vars.svcAction}} {{vars.svcName}} complete' }),
      step('show-result', { title: 'Result', label: 'Service Control Result' }),
    ],
  },

  {
    id: 427,
    name: 'List All Running Services',
    icon: 'list',
    color: 'bg-blue',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'Active Services',
        command: 'systemctl list-units --type=service --state=running --no-pager --plain 2>/dev/null | awk \'{print $1, $3, $4}\' | column -t | head -40',
      }),
      step('show-result', { title: 'Running Services', label: 'All Active systemd Services' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. USER MANAGEMENT (428–430)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 428,
    name: 'Failed Login Attempts',
    icon: 'lock',
    color: 'bg-red',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Fetch Failed Logins',
        command: 'sudo journalctl -u sshd -u ssh -n 100 --no-pager 2>/dev/null | grep -E "Invalid|Failed|refused|disconnected" | tail -30 || sudo grep -i "failed\\|invalid" /var/log/auth.log 2>/dev/null | tail -30 || echo "No auth log accessible"',
      }),
      step('show-result', { title: 'Failed Logins', label: 'Auth Failures (Last 30)' }),
    ],
  },

  {
    id: 429,
    name: 'Create System User',
    icon: 'user-plus',
    color: 'bg-green',
    category: 'admin',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'Username',
        label: 'New username:',
        placeholder: 'appuser',
      }),
      step('set-var', { varName: 'newUser' }),
      step('user-input', {
        title: 'Shell',
        label: 'Login shell (nologin for service accounts):',
        placeholder: '/usr/sbin/nologin',
        prefill: '/usr/sbin/nologin',
      }),
      step('set-var', { varName: 'userShell' }),
      step('confirm-dialog', {
        title: 'Create User',
        message: 'Create user "{{vars.newUser}}" with shell {{vars.userShell}}?',
      }),
      step('shell', {
        title: 'Creating User...',
        command: 'sudo useradd -m -s "{{vars.userShell}}" "{{vars.newUser}}" && echo "User {{vars.newUser}} created." && id "{{vars.newUser}}"',
      }),
      step('notification', { title: 'User Created', body: '{{vars.newUser}} added to the system' }),
      step('show-result', { title: 'Result', label: 'User Creation' }),
    ],
  },

  {
    id: 430,
    name: 'View Sudoers & Sudo Users',
    icon: 'shield',
    color: 'bg-purple',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'Fetch Sudoers',
        command: 'echo "=== /etc/sudoers (non-comment lines) ===" && sudo grep -Ev "^\\s*#|^\\s*$" /etc/sudoers 2>/dev/null && echo "" && echo "=== /etc/sudoers.d/ ===" && sudo ls /etc/sudoers.d/ 2>/dev/null && echo "" && echo "=== Users in sudo group ===" && getent group sudo wheel 2>/dev/null',
      }),
      step('show-result', { title: 'Sudoers', label: 'Sudo Permissions' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. PACKAGES (431–433)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 431,
    name: 'Install Package',
    icon: 'download',
    color: 'bg-green',
    category: 'admin',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'Package Name(s)',
        label: 'Space-separated package names:',
        placeholder: 'curl wget htop',
      }),
      step('set-var', { varName: 'pkgName' }),
      step('confirm-dialog', {
        title: 'Confirm Install',
        message: 'Install "{{vars.pkgName}}" via apt?',
      }),
      step('shell', {
        title: 'Installing...',
        command: 'sudo apt-get update -qq && sudo apt-get install -y {{vars.pkgName}} 2>&1 | tail -10',
      }),
      step('notification', { title: 'Install Complete', body: '{{vars.pkgName}} installed' }),
      step('show-result', { title: 'Install Result', label: 'Package Installation' }),
    ],
  },

  {
    id: 432,
    name: 'Update System Packages',
    icon: 'arrow-up-circle',
    color: 'bg-blue',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Check Available Updates',
        command: 'sudo apt-get update -qq 2>&1 | tail -3 && echo "" && apt list --upgradable 2>/dev/null | grep -v "Listing..." | head -20 && echo "" && echo "Upgradable count: $(apt list --upgradable 2>/dev/null | grep -c "\\[upgradable")"',
      }),
      step('confirm-dialog', {
        title: 'Apply Updates?',
        message: 'Run apt-get upgrade -y and dist-upgrade?',
      }),
      step('shell', {
        title: 'Upgrading...',
        command: 'sudo apt-get upgrade -y 2>&1 | tail -15 && sudo apt-get dist-upgrade -y 2>&1 | tail -5',
      }),
      step('notification', { title: 'Updates Done', body: 'System packages updated' }),
      step('show-result', { title: 'Update Result', label: 'System Update Complete' }),
    ],
  },

  {
    id: 433,
    name: 'Clean Up Packages',
    icon: 'trash-2',
    color: 'bg-orange',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'Dry Run Cleanup',
        command: 'echo "=== Packages to autoremove ===" && apt-get autoremove --dry-run 2>/dev/null | grep "^Remv" | head -20 && echo "" && echo "=== Package cache size ===" && du -sh /var/cache/apt/archives/ 2>/dev/null',
      }),
      step('confirm-dialog', {
        title: 'Clean Packages?',
        message: 'Remove unused packages and clean apt cache?',
      }),
      step('shell', {
        title: 'Cleaning...',
        command: 'sudo apt-get autoremove -y 2>&1 | tail -5 && sudo apt-get autoclean 2>&1 | tail -3 && echo "Cleanup complete."',
      }),
      step('notification', { title: 'Cleanup Done', body: 'Unused packages removed' }),
      step('show-result', { title: 'Cleanup Result', label: 'Package Cleanup' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. NETWORKING & SSH (434–437)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 434,
    name: 'Network Overview',
    icon: 'network',
    color: 'bg-cyan',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Network Info',
        command: 'echo "=== INTERFACES ===" && ip -brief addr && echo "" && echo "=== DEFAULT ROUTES ===" && ip route | grep default && echo "" && echo "=== DNS ===" && cat /etc/resolv.conf | grep "^nameserver" && echo "" && echo "=== LISTENING PORTS ===" && ss -tuln | grep LISTEN | awk \'{print $1, $5}\' | column -t | head -20',
      }),
      step('show-result', { title: 'Network Overview', label: 'Interfaces, Routes & Ports' }),
    ],
  },

  {
    id: 435,
    name: 'SSH Command Builder',
    icon: 'terminal',
    color: 'bg-purple',
    category: 'admin',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Target',
        label: 'user@host (or just host for current user):',
        placeholder: 'root@192.168.1.10',
      }),
      step('set-var', { varName: 'sshTarget' }),
      step('user-input', {
        title: 'Port',
        label: 'SSH port:',
        placeholder: '22',
        prefill: '22',
      }),
      step('set-var', { varName: 'sshPort' }),
      step('user-input', {
        title: 'Remote Command (optional)',
        label: 'Leave blank for interactive shell:',
        placeholder: 'systemctl status nginx',
        prefill: '',
      }),
      step('set-var', { varName: 'remoteCmd' }),
      step('shell', {
        title: 'Build SSH Command',
        command: 'if [ -n "{{vars.remoteCmd}}" ]; then echo "ssh -p {{vars.sshPort}} {{vars.sshTarget}} \'{{vars.remoteCmd}}\'"; else echo "ssh -p {{vars.sshPort}} {{vars.sshTarget}}"; fi',
      }),
      step('clipboard-write', { title: 'Copy SSH Command' }),
      step('notification', { title: 'Copied', body: 'SSH command copied to clipboard' }),
      step('show-result', { title: 'SSH Command', label: 'Ready to Paste in Terminal' }),
    ],
  },

  {
    id: 436,
    name: 'Check Firewall Status',
    icon: 'shield-alert',
    color: 'bg-red',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Firewall Rules',
        command: 'if command -v ufw &>/dev/null; then echo "=== UFW STATUS ===" && sudo ufw status verbose; elif command -v firewall-cmd &>/dev/null; then echo "=== FIREWALLD ===" && sudo firewall-cmd --list-all; else echo "=== IPTABLES ===" && sudo iptables -L -n -v 2>/dev/null | head -30; fi',
      }),
      step('show-result', { title: 'Firewall Status', label: 'Active Firewall Rules' }),
    ],
  },

  {
    id: 437,
    name: 'Ping & DNS Lookup',
    icon: 'globe',
    color: 'bg-indigo',
    category: 'admin',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'Host',
        label: 'Domain or IP to test:',
        placeholder: '8.8.8.8',
      }),
      step('set-var', { varName: 'target' }),
      step('shell', {
        title: 'Ping & DNS',
        command: 'echo "=== PING (4 packets) ===" && ping -c 4 -W 2 "{{vars.target}}" 2>&1 && echo "" && echo "=== DNS LOOKUP ===" && host "{{vars.target}}" 2>/dev/null || dig +short "{{vars.target}}" 2>/dev/null || nslookup "{{vars.target}}" 2>/dev/null',
      }),
      step('show-result', { title: 'Ping & DNS', label: 'Connectivity Test' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. LOGS (438–440)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 438,
    name: 'Journalctl — Service Logs',
    icon: 'file-text',
    color: 'bg-blue',
    category: 'admin',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Service',
        label: 'Service name (e.g. nginx, sshd, docker):',
        placeholder: 'nginx',
      }),
      step('set-var', { varName: 'svcLog' }),
      step('user-input', {
        title: 'Lines',
        label: 'Number of lines:',
        placeholder: '50',
        prefill: '50',
      }),
      step('set-var', { varName: 'logLines' }),
      step('shell', {
        title: 'Fetch Logs',
        command: 'journalctl -u "{{vars.svcLog}}" -n "{{vars.logLines}}" --no-pager --output=short 2>/dev/null || echo "Service not found or journalctl unavailable"',
      }),
      step('show-result', { title: 'Service Logs', label: '{{vars.svcLog}} journal' }),
    ],
  },

  {
    id: 439,
    name: 'Search Logs for Pattern',
    icon: 'search',
    color: 'bg-purple',
    category: 'admin',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'Log Path',
        label: 'File or directory (e.g. /var/log or /var/log/nginx/error.log):',
        placeholder: '/var/log',
      }),
      step('set-var', { varName: 'logPath' }),
      step('user-input', {
        title: 'Pattern',
        label: 'Keyword or regex:',
        placeholder: 'error|refused|timeout',
      }),
      step('set-var', { varName: 'logPattern' }),
      step('shell', {
        title: 'Searching...',
        command: 'grep -rEi "{{vars.logPattern}}" "{{vars.logPath}}" 2>/dev/null | tail -40 || echo "No matches found"',
      }),
      step('show-result', { title: 'Search Results', label: 'Log Pattern Matches' }),
    ],
  },

  {
    id: 440,
    name: 'Kernel Messages (dmesg)',
    icon: 'alert-triangle',
    color: 'bg-red',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'Recent Kernel Messages',
        command: 'dmesg --time-format reltime 2>/dev/null | tail -40 || dmesg | tail -40',
      }),
      step('show-result', { title: 'Kernel Messages', label: 'dmesg Output' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 7. BACKUP & RECOVERY (441–443)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 441,
    name: 'Backup Directory to Tar',
    icon: 'archive',
    color: 'bg-green',
    category: 'admin',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Source Path',
        label: 'Directory to backup:',
        placeholder: '/etc/nginx',
      }),
      step('set-var', { varName: 'srcPath' }),
      step('user-input', {
        title: 'Backup Directory',
        label: 'Where to save the archive:',
        placeholder: '/backups',
        prefill: '/backups',
      }),
      step('set-var', { varName: 'destDir' }),
      step('shell', {
        title: 'Create Archive',
        command: 'mkdir -p "{{vars.destDir}}" && BNAME=$(basename "{{vars.srcPath}}") && DATESTAMP=$(date +%Y%m%d-%H%M%S) && DEST="{{vars.destDir}}/${BNAME}_${DATESTAMP}.tar.gz" && tar -czf "$DEST" -C "$(dirname "{{vars.srcPath}}")" "$BNAME" && ls -lh "$DEST" && echo "Archive: $DEST"',
      }),
      step('notification', { title: 'Backup Complete', body: 'Archive saved to {{vars.destDir}}' }),
      step('show-result', { title: 'Backup Result', label: 'Tar Archive Created' }),
    ],
  },

  {
    id: 442,
    name: 'Restore from Tar Backup',
    icon: 'upload',
    color: 'bg-indigo',
    category: 'admin',
    favorite: false,
    steps: [
      step('file-picker', { title: 'Select Backup File', buttonLabel: 'Choose .tar.gz' }),
      step('set-var', { varName: 'backupFile' }),
      step('user-input', {
        title: 'Restore Destination',
        label: 'Extract to directory:',
        placeholder: '/restore',
      }),
      step('set-var', { varName: 'restoreDir' }),
      step('confirm-dialog', {
        title: 'Confirm Restore',
        message: 'Extract {{vars.backupFile}} into {{vars.restoreDir}}?',
      }),
      step('shell', {
        title: 'Extracting...',
        command: 'mkdir -p "{{vars.restoreDir}}" && tar -xzf "{{vars.backupFile}}" -C "{{vars.restoreDir}}" && echo "Restored to {{vars.restoreDir}}" && ls -la "{{vars.restoreDir}}"',
      }),
      step('notification', { title: 'Restore Complete', body: 'Files restored to {{vars.restoreDir}}' }),
      step('show-result', { title: 'Restore Result', label: 'Backup Restored' }),
    ],
  },

  {
    id: 443,
    name: 'Cleanup Old Backups',
    icon: 'trash-2',
    color: 'bg-orange',
    category: 'admin',
    favorite: false,
    steps: [
      step('user-input', {
        title: 'Backup Directory',
        label: 'Path to backup folder:',
        placeholder: '/backups',
      }),
      step('set-var', { varName: 'backupDir' }),
      step('user-input', {
        title: 'Retention Days',
        label: 'Delete backups older than N days:',
        placeholder: '30',
        prefill: '30',
      }),
      step('set-var', { varName: 'keepDays' }),
      step('shell', {
        title: 'Preview Files to Delete',
        command: 'echo "Files older than {{vars.keepDays}} days in {{vars.backupDir}}:" && find "{{vars.backupDir}}" -maxdepth 1 -type f -mtime +"{{vars.keepDays}}" -ls 2>/dev/null || echo "None found."',
      }),
      step('confirm-dialog', {
        title: 'Delete Old Backups?',
        message: 'Permanently delete files older than {{vars.keepDays}} days in {{vars.backupDir}}?',
      }),
      step('shell', {
        title: 'Deleting...',
        command: 'find "{{vars.backupDir}}" -maxdepth 1 -type f -mtime +"{{vars.keepDays}}" -delete && echo "Cleanup complete."',
      }),
      step('notification', { title: 'Cleanup Done', body: 'Old backups removed from {{vars.backupDir}}' }),
      step('show-result', { title: 'Cleanup Result', label: 'Old Backups Removed' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 8. SECURITY & AUDITING (444–447)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 444,
    name: 'Fail2Ban Status',
    icon: 'shield-check',
    color: 'bg-green',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Fail2Ban Overview',
        command: 'sudo fail2ban-client status 2>/dev/null || echo "Fail2Ban not running or not installed." && echo "" && echo "=== SSH Jail ===" && sudo fail2ban-client status sshd 2>/dev/null || sudo fail2ban-client status ssh 2>/dev/null || echo "No SSH jail found."',
      }),
      step('show-result', { title: 'Fail2Ban', label: 'Jail Status & Bans' }),
    ],
  },

  {
    id: 445,
    name: 'SSL Certificate Check',
    icon: 'badge-check',
    color: 'bg-cyan',
    category: 'admin',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Hostname',
        label: 'Domain to check (port optional):',
        placeholder: 'example.com:443',
      }),
      step('set-var', { varName: 'tlsHost' }),
      step('shell', {
        title: 'Check Certificate',
        command: 'HOST="{{vars.tlsHost}}" && [ -z "$(echo $HOST | grep :)" ] && HOST="${HOST}:443"; echo "=== SSL Certificate for $HOST ===" && echo | openssl s_client -servername "$(echo $HOST | cut -d: -f1)" -connect "$HOST" 2>/dev/null | openssl x509 -noout -subject -issuer -dates -fingerprint 2>/dev/null || echo "Could not retrieve certificate — check hostname and port."',
      }),
      step('show-result', { title: 'SSL Certificate', label: 'Cert Details & Expiry' }),
    ],
  },

  {
    id: 446,
    name: 'Open Ports & Listeners',
    icon: 'waypoints',
    color: 'bg-blue',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Listening Ports',
        command: 'echo "=== TCP LISTENERS ===" && ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null && echo "" && echo "=== UDP LISTENERS ===" && ss -ulnp 2>/dev/null || netstat -ulnp 2>/dev/null',
      }),
      step('show-result', { title: 'Open Ports', label: 'All Listening Services' }),
    ],
  },

  {
    id: 447,
    name: 'Security Audit Snapshot',
    icon: 'shield-alert',
    color: 'bg-red',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'Run Audit',
        command: [
          'echo "=== WORLD-WRITABLE FILES IN /etc ==="',
          'find /etc -maxdepth 2 -perm -o+w -type f 2>/dev/null | head -10 || echo "None found."',
          'echo ""',
          'echo "=== SUID BINARIES ==="',
          'find /usr -perm -4000 -type f 2>/dev/null | head -15',
          'echo ""',
          'echo "=== USERS WITH EMPTY PASSWORDS ==="',
          'sudo awk -F: \'$2=="" {print $1}\' /etc/shadow 2>/dev/null || echo "Access denied or none."',
          'echo ""',
          'echo "=== RECENTLY MODIFIED /etc FILES (last 7 days) ==="',
          'find /etc -maxdepth 2 -type f -mtime -7 2>/dev/null | head -10 || echo "None."',
        ].join(' && '),
      }),
      step('show-result', { title: 'Security Audit', label: 'Quick Security Snapshot' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 9. DATABASE (448–449)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 448,
    name: 'PostgreSQL Status',
    icon: 'database',
    color: 'bg-blue',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'PG Status',
        command: 'sudo systemctl status postgresql --no-pager -l 2>/dev/null | head -15 && echo "" && echo "=== ACTIVE CONNECTIONS ===" && sudo -u postgres psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;" 2>/dev/null && echo "" && echo "=== DATABASES ===" && sudo -u postgres psql -c "\\l" 2>/dev/null || echo "PostgreSQL not running or access denied."',
      }),
      step('show-result', { title: 'PostgreSQL', label: 'Status & Connections' }),
    ],
  },

  {
    id: 449,
    name: 'MySQL / MariaDB Status',
    icon: 'database',
    color: 'bg-purple',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'MySQL Status',
        command: '(sudo systemctl status mysql --no-pager 2>/dev/null || sudo systemctl status mariadb --no-pager 2>/dev/null) | head -15 && echo "" && echo "=== DATABASES ===" && sudo mysql -e "SHOW DATABASES;" 2>/dev/null && echo "" && echo "=== PROCESS LIST ===" && sudo mysql -e "SHOW FULL PROCESSLIST;" 2>/dev/null | head -15 || echo "MySQL/MariaDB not running or access denied."',
      }),
      step('show-result', { title: 'MySQL Status', label: 'Server & Databases' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 10. PERFORMANCE (450)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 450,
    name: 'System Resource Snapshot',
    icon: 'bar-chart',
    color: 'bg-orange',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Resource Snapshot',
        command: [
          'echo "=== CPU ==="',
          'top -bn1 | head -5',
          'echo ""',
          'echo "=== MEMORY ==="',
          'free -h',
          'echo ""',
          'echo "=== SWAP ==="',
          'swapon --show 2>/dev/null || echo "No swap configured."',
          'echo ""',
          'echo "=== DISK I/O ==="',
          'iostat -dx 1 1 2>/dev/null | tail -8 || echo "iostat not available (apt install sysstat)"',
          'echo ""',
          'echo "=== NETWORK I/O (1s sample) ==="',
          'IFACE=$(ip route | awk \'/default/{print $5; exit}\') && cat /proc/net/dev | grep "${IFACE}" | awk \'{rx=$2; tx=$10; print "RX: " rx " bytes  TX: " tx " bytes"}\'',
        ].join(' && '),
      }),
      step('show-result', { title: 'Performance', label: 'Resource Snapshot' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 11. DOCKER (451)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 451,
    name: 'Docker Overview',
    icon: 'container',
    color: 'bg-cyan',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Docker Status',
        // Note: uses single-quotes around docker format strings to avoid
        // conflict with the app's {{vars.*}} interpolation.
        command: 'docker version --format "Client: {{`{{.Client.Version}}`}} | Server: {{`{{.Server.Version}}`}}" 2>/dev/null || echo "Docker not available." && echo "" && echo "=== RUNNING CONTAINERS ===" && docker ps --format "table {{`{{.Names}}`}}\\t{{`{{.Image}}`}}\\t{{`{{.Status}}`}}\\t{{`{{.Ports}}`}}" 2>/dev/null || echo "No containers running." && echo "" && echo "=== IMAGES ===" && docker images --format "table {{`{{.Repository}}`}}:{{`{{.Tag}}`}}\\t{{`{{.Size}}`}}" 2>/dev/null | head -15',
      }),
      step('show-result', { title: 'Docker Overview', label: 'Containers & Images' }),
    ],
  },

  {
    id: 452,
    name: 'Docker Prune (Cleanup)',
    icon: 'trash-2',
    color: 'bg-red',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'Preview Unused Resources',
        command: 'echo "=== DISK USAGE ===" && docker system df 2>/dev/null || echo "Docker not available."',
      }),
      step('confirm-dialog', {
        title: 'Prune Docker?',
        message: 'Remove all stopped containers, dangling images, unused networks and build cache?',
      }),
      step('shell', {
        title: 'Pruning...',
        command: 'docker system prune -af 2>/dev/null && echo "Docker cleanup complete." && docker system df 2>/dev/null',
      }),
      step('notification', { title: 'Docker Pruned', body: 'Unused containers, images and cache removed' }),
      step('show-result', { title: 'Prune Result', label: 'Docker Cleanup Done' }),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 12. QUICK UTILITIES (453–455)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: 453,
    name: 'Copy SSH Public Key',
    icon: 'key',
    color: 'bg-green',
    category: 'admin',
    favorite: true,
    steps: [
      step('shell', {
        title: 'Get Public Key',
        command: 'cat ~/.ssh/id_ed25519.pub 2>/dev/null || cat ~/.ssh/id_rsa.pub 2>/dev/null || cat ~/.ssh/id_ecdsa.pub 2>/dev/null || echo "No SSH public key found. Generate one with: ssh-keygen -t ed25519"',
      }),
      step('clipboard-write', { title: 'Copy to Clipboard' }),
      step('notification', { title: 'Copied', body: 'SSH public key copied to clipboard' }),
      step('show-result', { title: 'SSH Public Key', label: 'Key copied to clipboard' }),
    ],
  },

  {
    id: 454,
    name: 'Environment & Path Check',
    icon: 'terminal',
    color: 'bg-indigo',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'Environment Info',
        command: 'echo "=== SHELL ===" && echo "$SHELL — $(bash --version | head -1)" && echo "" && echo "=== PATH ===" && echo "$PATH" | tr ":" "\\n" && echo "" && echo "=== KEY ENV VARS ===" && env | grep -E "^(HOME|USER|LANG|LC_|EDITOR|SUDO_|XDG_SESSION)" | sort && echo "" && echo "=== KERNEL ===" && uname -a',
      }),
      step('show-result', { title: 'Environment', label: 'Shell & System Environment' }),
    ],
  },

  {
    id: 455,
    name: 'Crontab Viewer',
    icon: 'calendar-clock',
    color: 'bg-yellow',
    category: 'admin',
    favorite: false,
    steps: [
      step('shell', {
        title: 'List Cron Jobs',
        command: 'echo "=== CURRENT USER CRONTAB ===" && crontab -l 2>/dev/null || echo "No crontab for current user." && echo "" && echo "=== SYSTEM CRON (/etc/cron*) ===" && ls /etc/cron.d /etc/cron.daily /etc/cron.hourly /etc/cron.weekly /etc/cron.monthly 2>/dev/null && echo "" && echo "=== /etc/cron.d/ files ===" && ls -la /etc/cron.d/ 2>/dev/null',
      }),
      step('show-result', { title: 'Crontab', label: 'All Scheduled Jobs' }),
    ],
  },

]
