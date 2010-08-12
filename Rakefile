require 'ftools'

root_dir = File.expand_path(File.dirname(__FILE__))+'/'
local_dir = Regexp.new '^'+Dir.pwd+'/'
src_dir = root_dir+'Source/'
build_dir = root_dir+'Build/'
test_dir = root_dir+'Test/'

default_in_file = src_dir+'FunctionalJS.coffee'
default_out_file = build_dir+File.basename(default_in_file).sub(/\.coffee$/,'.js')
default_min_file = build_dir+'FunctionalJS.min.js'
default_test_suite = test_dir+'unitTests.htm'

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
	args.with_defaults :out_file=>default_out_file, :in_file=>default_in_file
	out_file = File.dirname(args[:out_file].dup).sub(local_dir,'').inspect
	in_file = args[:in_file].dup.sub(local_dir,'').inspect
	begin
		sh "#{coffee} #{build_options.join ' '} -w -o #{out_file} #{in_file}"
	rescue
		print "\b\b  \n"
	end
end

desc 'compile coffeescript to javascript'
task :build, [:out_file,:in_file] => ['coffee',build_dir] do |task,args|
	puts "Compiling with #{coffee =~ /"/ ? coffee.inspect : coffee}"
	args.with_defaults :out_file=>default_out_file, :in_file=>default_in_file
	out_file = File.dirname(args[:out_file].dup).sub(local_dir,'').inspect
	in_file = args[:in_file].dup.sub(local_dir,'').inspect
	sh "#{coffee} #{build_options.join ' '} -o #{out_file} #{in_file}"
	puts "  Compilation successful"
end

desc 'run generated JS through google closure compiler'
task :minify, [:out_file,:in_file] => [build_dir] do |task,args|
	require 'json'
	require 'net/http'
	require 'uri'
	require 'cgi'

	puts 'Minifying with Google closure compiler...'

	args.with_defaults :out_file=>default_min_file, :in_file=>default_out_file
	throw Exception.new('File selected for minification does not exist: '+out_file.to_s) unless File.exists? args[:in_file]
	source = File.read args[:in_file]

	uri = URI.parse('http://closure-compiler.appspot.com/compile')
	options = [
		'js_code='+CGI.escape(source),
		'output_format=json',
		#'compilation_level=ADVANCED_OPTIMIZATIONS',
		'compilation_level=SIMPLE_OPTIMIZATIONS',
		'output_info=compiled_code',
		'output_info=warnings',
		'output_info=errors',
		'output_info=statistics',
		'warning_level=default',
	].join('&')

	response = Net::HTTP.new(uri.host, uri.port).start { |http| http.post uri.path, options }
	response.error! unless response.code =~ /2\d\d/

	json = JSON.parse response.body.to_s
	File.new(args[:out_file],'w').write json['compiledCode']

	puts "  Minification successful"
	stats = json['statistics']
	puts "  Original Size: #{stats['originalSize']} bytes (#{stats['originalGzipSize']} bytes gzipped)"
	puts "  Compiled Size: #{stats['compressedSize']} bytes (#{stats['compressedGzipSize']} bytes gzipped)"
	ratio = stats['compressedSize'].to_f / stats['originalSize'].to_f
	gzipRatio = stats['compressedGzipSize'].to_f / stats['originalGzipSize'].to_f
	puts "  Saved %.2f%% off the original size (%.2f%% off the gzipped size)" % [100*ratio,100*gzipRatio]
end

desc 'open the test suite in the default web browser'
task :test, [:file] do |task,args|
	args.with_defaults :file=>default_test_suite
	sh "htmlview #{args[:file].inspect} &> /dev/null"
end

desc 'remove all generated code'
task :clean do
	Dir[build_dir+'/**/*'].each do |file|
		FileUtils.rm file
	end
	FileUtils.rm_r build_dir
end
