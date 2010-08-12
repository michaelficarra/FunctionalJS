require 'ftools'

root_dir = File.expand_path(File.dirname(__FILE__))+'/'
src_dir = root_dir+'Source/'
build_dir = root_dir+'Build/'
test_dir = root_dir+'Test/'

in_file = src_dir+'FunctionalJS.coffee'
out_file = build_dir+File.basename(in_file).sub(/\.coffee$/,'.js')
min_file = build_dir+'FunctionalJS.min.js'
test_suite = test_dir+'unitTests.htm'

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
task :continuous, [:out_file,:in_file] => ['coffee',build_dir] do |task,args|
	args.with_defaults :out_file=>out_file, :in_file=>in_file
	args[:out_file] = File.dirname(args[:out_file]).inspect
	args[:in_file] = args[:in_file].inspect
	sh "#{coffee} #{build_options.join ' '} -w -o #{args[:out_file]} #{args[:in_file]}"
end

desc 'compile coffeescript to javascript'
task :build, [:out_file,:in_file] => ['coffee',build_dir] do |task,args|
	args.with_defaults :out_file=>out_file, :in_file=>in_file
	args[:out_file] = File.dirname(args[:out_file]).inspect
	args[:in_file] = args[:in_file].inspect
	sh "#{coffee} #{build_options.join ' '} -o #{args[:out_file]} #{args[:in_file]}"
end

desc 'run generated JS through google closure compiler'
task :minify, [:out_file,:in_file] do |task,args|
	require 'json'
	require 'net/http'
	require 'uri'
	require 'cgi'

	args.with_defaults :out_file=>min_file, :in_file=>out_file
	throw Exception.new('File selected for minification does not exist: '+out_file.to_s) unless File.exists? args[:in_file]
	source = File.read args[:in_file]

	uri = URI.parse('http://closure-compiler.appspot.com/compile')
	options = [
		'js_code='+CGI.escape(source),
		'output_format=json',
		'compilation_level=ADVANCED_OPTIMIZATIONS',
		'output_info=compiled_code',
		'output_info=warnings',
		'output_info=errors',
		'output_info=statistics',
		'warning_level=default',
	].join('&')

	response = Net::HTTP.new(uri.host, uri.port).start { |http| http.post uri.path, options }
	response.error! unless response.code =~ /2\d\d/

	json = JSON.parse response.body.to_s
	stats = json['statistics']
	ratio = stats['compressedSize'].to_i / stats['originalSize'].to_i
	gzipRation = stats['compressedGzipSize'].to_i / stats['originalGzipSize'].to_i
	File.new(args[:out_file],'w').write json['compiledCode']
end

desc 'open the test suite in the default web browser'
task :test, [:file] do |task,args|
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
