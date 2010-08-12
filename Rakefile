require 'ftools'

root_dir = File.expand_path(File.dirname(__FILE__))+'/'
src_dir = root_dir+'Source/'
build_dir = root_dir+'Build/'
test_dir = root_dir+'Test/'

in_file = src_dir+'/FunctionalJS.coffee'
out_file = build_dir+'/FunctionalJS.js'
min_file = build_dir+'/FunctionalJS.min.js'
test_suite = test_dir+'/unitTests.htm'

coffee = nil
build_options = %w[--no-wrap -c -l]

task :default => [:build,:minify]

directory build_dir

desc 'check existence of coffeescript compiler and store its location'
file 'coffee' do
	coffee = `which coffee`.chomp
	throw Exception.new('CoffeeScript compiler not in path') unless $?.success?
	coffee
end

desc 'continuously watch for changes to input file and compile'
task :continuous, [:out_file,:in_file] => ['coffee',build_dir] do
	args.with_defaults :out_file=>out_file, :in_file=>in_file
	out_file = args[:out_file].inspect
	in_file = args[:in_file].inspect
	sh "#{coffee} #{build_options.join ' '} -w -o #{out_file} #{in_file}"
end

desc 'compile coffeescript to javascript'
task :build, [:out_file,:in_file] => ['coffee',build_dir] do
	args.with_defaults :out_file=>out_file, :in_file=>in_file
	out_file = args[:out_file].inspect
	in_file = args[:in_file].inspect
	sh "#{coffee} #{build_options.join ' '} -o #{out_file} #{in_file}"
end

desc 'run generated JS through google closure compiler'
task :minify, [:file] do
	require 'json'
	require 'net/http'
	require 'uri'
	require 'cgi'

	args.with_defaults :file=>out_file
	throw Exception.new('File selected for minification does not exist') unless File.exists? args[:file]
	source = File.read args[:file]

	uri = URI.parse('http://closure-compiler.appspot.com/compile')
	options = [
		'json_code='+CGI.escape(source),
		'output_format=json',
		'compilation_level=ADVANCED_OPTIMIZATIONS',
		'output_info=compiled_code',
		'output_info=warnings',
		'output_info=errors',
		'output_info=statistics',
		'warning_level=default',
	].join('&')

	response = Net::HTTP.post_form uri, options
	response.error! unless response === Net::HTTPSuccess and response.body_permitted?

	json = JSON.parse response.body.to_s
end

desc 'open the test suite in the default web browser'
task :test, [:file] do
	args.with_defaults :file=>test_suite
	sh "htmlview #{args[:file].inspect}"
end

desc 'remove all generated code'
task :clean do
	Dir[build_dir+'/**/*'].each do |file|
		File.remove_entry_secure file, true
	end
	File.remove_entry_secure build_dir, true
end
