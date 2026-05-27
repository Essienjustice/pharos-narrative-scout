const chalk = require('chalk');
const figlet = require('figlet');

console.clear();

figlet.text('Pharos Agent Kit', {
  font: 'Standard',
  horizontalLayout: 'default',
  verticalLayout: 'default'
}, function(err, data) {
  if (err) {
    console.log('Something went wrong...');
    return;
  }
  console.log(chalk.cyan(data));
  console.log('');
  console.log(chalk.yellow('🚀 Welcome to Pharos Agent Kit!'));
  console.log(chalk.green('✨ The toolkit for connecting AI agents to Pharos protocols'));
  console.log('');
  console.log(chalk.white('Documentation:'), chalk.blue('https://docs.pharos.xyz'));
  console.log(chalk.white('GitHub:'), chalk.blue('https://github.com/pharos-agent-kit/pharos-agent-kit'));
  console.log('');
  console.log(chalk.magenta('Happy building! 🎉'));
});